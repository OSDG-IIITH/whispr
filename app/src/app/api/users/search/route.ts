/**
 * GET /api/users/search/
 * Search users by username (for mentions, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50)

        if (!query.trim()) {
            return NextResponse.json([])
        }

        const users = await prisma.user.findMany({
            where: {
                username: { contains: query, mode: 'insensitive' },
                is_banned: false,
            },
            take: limit,
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
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Search users error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
