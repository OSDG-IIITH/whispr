/**
 * GET /api/users/[userId]/followers/
 * Get followers of a user.
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

        // Get followers (users who follow this user)
        const followers = await prisma.userFollower.findMany({
            where: { followed_id: userId },
            skip,
            take: limit,
            include: {
                follower: {
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

        // Return just the follower user objects
        const followerUsers = followers
            .map(f => f.follower)
            .filter(u => !u.is_banned)

        return NextResponse.json(followerUsers)
    } catch (error) {
        console.error('Get followers error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
