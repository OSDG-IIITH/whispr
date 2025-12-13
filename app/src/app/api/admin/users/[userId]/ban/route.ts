/**
 * POST /api/admin/users/[userId]/ban/
 * Ban a user (admin only).
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

        if (!currentUser.is_admin) {
            return NextResponse.json(
                { detail: 'Admin access required' },
                { status: 403 }
            )
        }

        const { userId } = await params
        const body = await request.json()
        const { reason, duration_days } = body

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!targetUser) {
            return NextResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            )
        }

        if (targetUser.is_admin) {
            return NextResponse.json(
                { detail: 'Cannot ban an admin user' },
                { status: 400 }
            )
        }

        const bannedUntil = duration_days
            ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000)
            : null // null = permanent ban

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                is_banned: true,
                ban_reason: reason || 'No reason provided',
                banned_until: bannedUntil,
                banned_by: currentUser.username,
                banned_at: new Date(),
                updated_at: new Date(),
            },
        })

        return NextResponse.json({
            id: updatedUser.id,
            username: updatedUser.username,
            is_banned: updatedUser.is_banned,
            ban_reason: updatedUser.ban_reason,
            banned_until: updatedUser.banned_until?.toISOString() || null,
            banned_by: updatedUser.banned_by,
            banned_at: updatedUser.banned_at?.toISOString() || null,
        })
    } catch (error) {
        console.error('Ban user error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/users/[userId]/ban/
 * Unban a user (admin only).
 */
export async function DELETE(
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

        if (!currentUser.is_admin) {
            return NextResponse.json(
                { detail: 'Admin access required' },
                { status: 403 }
            )
        }

        const { userId } = await params

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!targetUser) {
            return NextResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            )
        }

        if (!targetUser.is_banned) {
            return NextResponse.json(
                { detail: 'User is not banned' },
                { status: 400 }
            )
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                is_banned: false,
                ban_reason: null,
                banned_until: null,
                banned_by: null,
                banned_at: null,
                updated_at: new Date(),
            },
        })

        return NextResponse.json({
            message: `User ${targetUser.username} has been unbanned`,
        })
    } catch (error) {
        console.error('Unban user error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
