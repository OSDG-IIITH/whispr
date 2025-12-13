/**
 * POST /api/notifications/mark-all-read/
 * Mark all notifications as read for the current user.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        await prisma.notification.updateMany({
            where: {
                username: currentUser.username,
                is_read: false,
            },
            data: {
                is_read: true,
            },
        })

        return NextResponse.json({ message: 'All notifications marked as read' })
    } catch (error) {
        console.error('Mark all read error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
