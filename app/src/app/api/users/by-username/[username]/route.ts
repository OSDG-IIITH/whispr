/**
 * GET /api/users/by-username/[username]/
 * Get a specific user by username.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params

        const user = await prisma.user.findUnique({
            where: { username },
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
        console.error('Get user by username error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
