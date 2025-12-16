/**
 * GET /api/feed/
 * Get personalized infinite feed for the current user.
 * 
 * Phase 1: Returns reviews from followed users first
 * Phase 2: After following reviews exhausted, returns general reviews
 * 
 * Query params:
 * - skip: Number of items to skip
 * - limit: Max items to return (default 20, max 50)
 * - phase: "following" or "general" to control which phase
 * - following_exhausted: true if client has exhausted following reviews
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const reviewInclude = {
    user: {
        select: {
            id: true,
            username: true,
            is_muffled: true,
            is_admin: true,
            is_banned: true,
            echoes: true,
        },
    },
    course: {
        select: {
            id: true,
            code: true,
            name: true,
        },
    },
    professor: {
        select: {
            id: true,
            name: true,
        },
    },
    course_instructor_reviews: {
        include: {
            course_instructor: {
                select: {
                    id: true,
                    course: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                    professor: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    },
}

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
        const phase = searchParams.get('phase') || 'following'
        const followingExhausted = searchParams.get('following_exhausted') === 'true'

        // Get following IDs
        const following = await prisma.userFollower.findMany({
            where: { follower_id: currentUser.id },
            select: { followed_id: true },
        })
        const followingIds = following.map(f => f.followed_id)

        // Set of IDs to exclude (for general phase, exclude user's own reviews)
        const excludeUserIds = [currentUser.id]

        let reviews
        let hasMoreFollowing = true
        let hasMoreGeneral = true

        // Phase 1: Following reviews
        if (phase === 'following' && followingIds.length > 0 && !followingExhausted) {
            const followingTotal = await prisma.review.count({
                where: { user_id: { in: followingIds } },
            })

            reviews = await prisma.review.findMany({
                where: { user_id: { in: followingIds } },
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: reviewInclude,
            })

            hasMoreFollowing = skip + reviews.length < followingTotal

            // If no more following reviews, return with signal to switch phase
            if (reviews.length === 0 || !hasMoreFollowing) {
                // Get first batch of general reviews
                const generalReviews = await prisma.review.findMany({
                    where: {
                        user_id: { notIn: [...followingIds, ...excludeUserIds] },
                    },
                    skip: 0,
                    take: limit,
                    orderBy: { created_at: 'desc' },
                    include: reviewInclude,
                })

                // Return combined remaining following + general
                const formattedReviews = [...reviews, ...generalReviews].map(review => ({
                    ...review,
                    course_instructors: review.course_instructor_reviews.map(cir => ({
                        id: cir.course_instructor.id,
                        course: cir.course_instructor.course,
                        professor: cir.course_instructor.professor,
                    })),
                    is_from_following: followingIds.includes(review.user_id),
                }))

                return NextResponse.json({
                    reviews: formattedReviews,
                    phase: 'general',
                    has_more: generalReviews.length === limit,
                    following_exhausted: true,
                    general_skip: generalReviews.length,
                })
            }
        }
        // Phase 2: General reviews (not from followed users or self)
        else {
            const generalSkip = parseInt(searchParams.get('general_skip') || '0', 10)

            reviews = await prisma.review.findMany({
                where: {
                    user_id: { notIn: [...followingIds, ...excludeUserIds] },
                },
                skip: generalSkip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: reviewInclude,
            })

            const generalTotal = await prisma.review.count({
                where: {
                    user_id: { notIn: [...followingIds, ...excludeUserIds] },
                },
            })

            hasMoreGeneral = generalSkip + reviews.length < generalTotal
        }

        // Transform to expected format
        const formattedReviews = reviews.map(review => ({
            ...review,
            course_instructors: review.course_instructor_reviews.map(cir => ({
                id: cir.course_instructor.id,
                course: cir.course_instructor.course,
                professor: cir.course_instructor.professor,
            })),
            is_from_following: followingIds.includes(review.user_id),
        }))

        return NextResponse.json({
            reviews: formattedReviews,
            phase: phase === 'following' && hasMoreFollowing ? 'following' : 'general',
            has_more: phase === 'following' ? hasMoreFollowing : hasMoreGeneral,
            following_exhausted: phase !== 'following' || !hasMoreFollowing,
            general_skip: phase === 'general' ?
                parseInt(searchParams.get('general_skip') || '0', 10) + reviews.length : 0,
        })
    } catch (error) {
        console.error('Get feed error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
