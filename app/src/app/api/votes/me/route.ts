/**
 * GET /api/votes/me/
 * Get votes made by the current user.
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
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)
        const reviewId = searchParams.get('review_id')
        const replyId = searchParams.get('reply_id')

        const where: {
            user_id: string
            review_id?: string
            reply_id?: string
        } = { user_id: currentUser.id }
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
        console.error('Get my votes error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
