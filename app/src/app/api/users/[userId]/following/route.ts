/**
 * GET /api/users/[userId]/following/
 * Get users that a user is following.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            return NextResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            )
        }

        // Get following (users this user follows)
        const following = await prisma.userFollower.findMany({
            where: { follower_id: userId },
            skip,
            take: limit,
            include: {
                followed: {
                    select: {
                        id: true,
                        username: true,
                        bio: true,
                        student_since_year: true,
                        is_muffled: true,
                        is_admin: true,
                        is_banned: true,
                        echoes: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        })

        // Return just the following user objects
        const followingUsers = following
            .map(f => f.followed)
            .filter(u => !u.is_banned)

        return NextResponse.json(followingUsers)
    } catch (error) {
        console.error('Get following error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
