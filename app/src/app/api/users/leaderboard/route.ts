/**
 * GET /api/users/leaderboard/
 * Get top users by echoes.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100)

        const users = await prisma.user.findMany({
            where: {
                is_banned: false,
                is_muffled: false, // Only show verified users
            },
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
            orderBy: { echoes: 'desc' },
            take: limit,
        })

        return NextResponse.json(users, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        })
    } catch (error) {
        console.error('Get leaderboard error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
