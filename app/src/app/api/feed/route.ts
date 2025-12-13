/**
 * GET /api/feed/
 * Get personalized feed for the current user.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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

        // Get users that the current user is following
        const following = await prisma.userFollower.findMany({
            where: { follower_id: currentUser.id },
            select: { followed_id: true },
        })
        const followingIds = following.map(f => f.followed_id)

        // Get reviews from followed users + recent popular reviews
        const reviews = await prisma.review.findMany({
            where: {
                OR: [
                    { user_id: { in: followingIds } },
                    // Include popular reviews from the last 7 days
                    {
                        AND: [
                            { created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                            { upvotes: { gte: 5 } },
                        ],
                    },
                ],
            },
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
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
                            include: {
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
            },
        })

        // Transform to expected format
        const formattedReviews = reviews.map(review => ({
            ...review,
            course_instructors: review.course_instructor_reviews.map(cir => ({
                id: cir.course_instructor.id,
                course: cir.course_instructor.course,
                professor: cir.course_instructor.professor,
            })),
        }))

        return NextResponse.json(formattedReviews)
    } catch (error) {
        console.error('Get feed error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
