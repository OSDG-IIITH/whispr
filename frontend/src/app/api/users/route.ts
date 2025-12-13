/**
 * GET /api/users/
 * Retrieve users with optional pagination.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)

        const users = await prisma.user.findMany({
            skip,
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
            orderBy: { created_at: 'desc' },
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Get users error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
