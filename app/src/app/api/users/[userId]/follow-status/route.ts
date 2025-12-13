/**
 * GET /api/users/[userId]/follow-status/
 * Get follow status between current user and target user.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { userId } = await params

        // Check if current user is following target
        const isFollowing = await prisma.userFollower.findUnique({
            where: {
                follower_id_followed_id: {
                    follower_id: currentUser.id,
                    followed_id: userId,
                },
            },
        })

        // Check if target is following current user
        const isFollowedBy = await prisma.userFollower.findUnique({
            where: {
                follower_id_followed_id: {
                    follower_id: userId,
                    followed_id: currentUser.id,
                },
            },
        })

        // Get follower/following counts
        const [followersCount, followingCount] = await Promise.all([
            prisma.userFollower.count({
                where: { followed_id: userId },
            }),
            prisma.userFollower.count({
                where: { follower_id: userId },
            }),
        ])

        return NextResponse.json({
            user_id: userId,
            is_following: !!isFollowing,
            is_followed_by: !!isFollowedBy,
            followers_count: followersCount,
            following_count: followingCount,
        })
    } catch (error) {
        console.error('Get follow status error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
