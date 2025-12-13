/**
 * GET /api/votes/
 * Retrieve votes with optional filters.
 * 
 * POST /api/votes/
 * Create a new vote.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)
        const userId = searchParams.get('user_id')
        const reviewId = searchParams.get('review_id')
        const replyId = searchParams.get('reply_id')

        const where: Prisma.VoteWhereInput = {}
        if (userId) where.user_id = userId
        if (reviewId) where.review_id = reviewId
        if (replyId) where.reply_id = replyId

        const votes = await prisma.vote.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })

        return NextResponse.json(votes)
    } catch (error) {
        console.error('Get votes error:', error)
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

        const body = await request.json()
        const { review_id, reply_id, vote_type } = body

        // Must have exactly one of review_id or reply_id
        if ((!review_id && !reply_id) || (review_id && reply_id)) {
            return NextResponse.json(
                { detail: 'Must specify either review_id or reply_id, but not both' },
                { status: 400 }
            )
        }

        if (typeof vote_type !== 'boolean') {
            return NextResponse.json(
                { detail: 'vote_type must be a boolean (true for upvote, false for downvote)' },
                { status: 400 }
            )
        }

        // Check if user already voted on this review/reply
        const existingVote = await prisma.vote.findFirst({
            where: {
                user_id: currentUser.id,
                ...(review_id ? { review_id } : { reply_id }),
            },
        })

        if (existingVote) {
            // If same vote type, remove the vote
            if (existingVote.vote_type === vote_type) {
                await prisma.vote.delete({
                    where: { id: existingVote.id },
                })

                // Update vote counts
                if (review_id) {
                    await prisma.review.update({
                        where: { id: review_id },
                        data: vote_type
                            ? { upvotes: { decrement: 1 } }
                            : { downvotes: { decrement: 1 } },
                    })
                } else {
                    await prisma.reply.update({
                        where: { id: reply_id },
                        data: vote_type
                            ? { upvotes: { decrement: 1 } }
                            : { downvotes: { decrement: 1 } },
                    })
                }

                return new NextResponse(null, { status: 204 })
            }

            // Otherwise, update the vote
            const updatedVote = await prisma.vote.update({
                where: { id: existingVote.id },
                data: { vote_type, updated_at: new Date() },
            })

            // Update vote counts (switch from one to the other)
            if (review_id) {
                await prisma.review.update({
                    where: { id: review_id },
                    data: vote_type
                        ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
                        : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } },
                })
            } else {
                await prisma.reply.update({
                    where: { id: reply_id },
                    data: vote_type
                        ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
                        : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } },
                })
            }

            return NextResponse.json(updatedVote)
        }

        // Create new vote
        const vote = await prisma.vote.create({
            data: {
                user_id: currentUser.id,
                review_id: review_id || null,
                reply_id: reply_id || null,
                vote_type,
            },
        })

        // Update vote counts
        if (review_id) {
            await prisma.review.update({
                where: { id: review_id },
                data: vote_type
                    ? { upvotes: { increment: 1 } }
                    : { downvotes: { increment: 1 } },
            })

            // Create notification for review author
            const review = await prisma.review.findUnique({
                where: { id: review_id },
                include: { user: true },
            })
            if (review && review.user_id !== currentUser.id) {
                await prisma.notification.create({
                    data: {
                        username: review.user.username,
                        type: 'VOTE',
                        content: `${currentUser.username} ${vote_type ? 'upvoted' : 'downvoted'} your review`,
                        source_id: review_id,
                        source_type: 'review',
                        actor_username: currentUser.username,
                    },
                })
            }
        } else {
            await prisma.reply.update({
                where: { id: reply_id },
                data: vote_type
                    ? { upvotes: { increment: 1 } }
                    : { downvotes: { increment: 1 } },
            })

            // Create notification for reply author
            const reply = await prisma.reply.findUnique({
                where: { id: reply_id },
                include: { user: true },
            })
            if (reply && reply.user_id !== currentUser.id) {
                await prisma.notification.create({
                    data: {
                        username: reply.user.username,
                        type: 'VOTE',
                        content: `${currentUser.username} ${vote_type ? 'upvoted' : 'downvoted'} your reply`,
                        source_id: reply_id,
                        source_type: 'reply',
                        actor_username: currentUser.username,
                    },
                })
            }
        }

        return NextResponse.json(vote, { status: 201 })
    } catch (error) {
        console.error('Create vote error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
