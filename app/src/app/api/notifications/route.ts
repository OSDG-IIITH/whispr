/**
 * GET /api/notifications/
 * Retrieve notifications for the current user.
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
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
        const unreadOnly = searchParams.get('unread_only') === 'true'

        const where = {
            username: currentUser.username,
            ...(unreadOnly ? { is_read: false } : {}),
        }

        const notifications = await prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error('Get notifications error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
