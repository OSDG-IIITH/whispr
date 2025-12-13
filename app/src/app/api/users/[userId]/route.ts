/**
 * GET /api/users/[userId]/
 * Get a specific user by ID.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params

        const user = await prisma.user.findUnique({
            where: { id: userId },
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
        })

        if (!user) {
            return NextResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
