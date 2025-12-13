/**
 * GET /api/replies/
 * Retrieve replies with optional filters.
 * 
 * POST /api/replies/
 * Create a new reply.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser, requireUnmuffledUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { createMentionNotifications } from '@/lib/notifications'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)
        const reviewId = searchParams.get('review_id')
        const userId = searchParams.get('user_id')

        const where: Prisma.ReplyWhereInput = {}
        if (reviewId) where.review_id = reviewId
        if (userId) where.user_id = userId

        const replies = await prisma.reply.findMany({
            where,
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
                review: {
                    select: {
                        id: true,
                        course: {
                            select: {
                                id: true,
                                code: true,
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json(replies)
    } catch (error) {
        console.error('Get replies error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        try {
            requireUnmuffledUser(currentUser)
        } catch (e) {
            return NextResponse.json(
                { detail: (e as Error).message },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { review_id, content } = body

        if (!review_id) {
            return NextResponse.json(
                { detail: 'review_id is required' },
                { status: 400 }
            )
        }

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { detail: 'Content is required' },
                { status: 400 }
            )
        }

        // Check if review exists
        const review = await prisma.review.findUnique({
            where: { id: review_id },
            include: { user: true },
        })

        if (!review) {
            return NextResponse.json(
                { detail: 'Review not found' },
                { status: 404 }
            )
        }

        const reply = await prisma.reply.create({
            data: {
                review_id,
                user_id: currentUser.id,
                content: content.trim(),
            },
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
            },
        })

        // Create notification for review author
        if (review.user_id !== currentUser.id) {
            await prisma.notification.create({
                data: {
                    username: review.user.username,
                    type: 'REPLY',
                    content: `${currentUser.username} replied to your review`,
                    source_id: reply.id,
                    source_type: 'reply',
                    actor_username: currentUser.username,
                },
            })
        }

        // Award echo points
        await prisma.user.update({
            where: { id: currentUser.id },
            data: { echoes: { increment: 5 } },
        })

        // Create @mention notifications for reply
        await createMentionNotifications({
            content: content.trim(),
            actorUsername: currentUser.username,
            sourceId: reply.id,
            sourceType: 'reply',
        })

        return NextResponse.json(reply, { status: 201 })
    } catch (error) {
        console.error('Create reply error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
