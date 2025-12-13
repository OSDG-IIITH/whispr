/**
 * DELETE /api/votes/[voteId]/
 * Delete a vote.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ voteId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { voteId } = await params

        const vote = await prisma.vote.findUnique({
            where: { id: voteId },
        })

        if (!vote) {
            return NextResponse.json(
                { detail: 'Vote not found' },
                { status: 404 }
            )
        }

        if (vote.user_id !== currentUser.id) {
            return NextResponse.json(
                { detail: 'Not authorized' },
                { status: 403 }
            )
        }

        // Update vote counts before deleting
        if (vote.review_id) {
            await prisma.review.update({
                where: { id: vote.review_id },
                data: vote.vote_type
                    ? { upvotes: { decrement: 1 } }
                    : { downvotes: { decrement: 1 } },
            })
        } else if (vote.reply_id) {
            await prisma.reply.update({
                where: { id: vote.reply_id },
                data: vote.vote_type
                    ? { upvotes: { decrement: 1 } }
                    : { downvotes: { decrement: 1 } },
            })
        }

        await prisma.vote.delete({
            where: { id: voteId },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Delete vote error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
