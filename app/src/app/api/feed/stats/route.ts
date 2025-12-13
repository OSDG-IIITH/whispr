/**
 * GET /api/feed/stats/
 * Get stats for the current user's activity.
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

        const [reviewCount, replyCount, voteCount, followersCount, followingCount] = await Promise.all([
            prisma.review.count({ where: { user_id: currentUser.id } }),
            prisma.reply.count({ where: { user_id: currentUser.id } }),
            prisma.vote.count({ where: { user_id: currentUser.id } }),
            prisma.userFollower.count({ where: { followed_id: currentUser.id } }),
            prisma.userFollower.count({ where: { follower_id: currentUser.id } }),
        ])

        return NextResponse.json({
            review_count: reviewCount,
            reply_count: replyCount,
            vote_count: voteCount,
            followers_count: followersCount,
            following_count: followingCount,
            echoes: currentUser.echoes,
        })
    } catch (error) {
        console.error('Get feed stats error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
