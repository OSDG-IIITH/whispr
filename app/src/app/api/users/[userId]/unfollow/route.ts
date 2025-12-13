/**
 * POST /api/users/[userId]/unfollow/
 * Unfollow a user.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
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

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!targetUser) {
            return NextResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            )
        }

        // Check if following
        const existingFollow = await prisma.userFollower.findUnique({
            where: {
                follower_id_followed_id: {
                    follower_id: currentUser.id,
                    followed_id: userId,
                },
            },
        })

        if (!existingFollow) {
            return NextResponse.json(
                { detail: 'Not following this user' },
                { status: 400 }
            )
        }

        // Delete follow relationship
        await prisma.userFollower.delete({
            where: {
                follower_id_followed_id: {
                    follower_id: currentUser.id,
                    followed_id: userId,
                },
            },
        })

        return NextResponse.json({
            id: targetUser.id,
            username: targetUser.username,
            bio: targetUser.bio,
            student_since_year: targetUser.student_since_year,
            is_muffled: targetUser.is_muffled,
            is_admin: targetUser.is_admin,
            is_banned: targetUser.is_banned,
            echoes: targetUser.echoes,
            created_at: targetUser.created_at.toISOString(),
            updated_at: targetUser.updated_at.toISOString(),
        })
    } catch (error) {
        console.error('Unfollow user error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
