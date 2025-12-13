/**
 * POST /api/admin/users/[userId]/unban/
 * Unban a user (admin only).
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit-logger'

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

        const updatedUser = await prisma.user.update({
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

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: 'UNBAN',
            entityType: 'USER',
            entityId: userId,
            entityName: targetUser.username,
            details: {
                previous_ban_reason: targetUser.ban_reason,
            },
        })

        return NextResponse.json({
            id: updatedUser.id,
            username: updatedUser.username,
            is_banned: updatedUser.is_banned,
        })
    } catch (error) {
        console.error('Unban user error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
