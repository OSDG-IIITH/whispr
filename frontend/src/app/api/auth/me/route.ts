/**
 * GET /api/auth/me/
 * Get current user information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        // Return user data (excluding sensitive fields)
        return NextResponse.json({
            id: user.id,
            username: user.username,
            bio: user.bio,
            student_since_year: user.student_since_year,
            is_muffled: user.is_muffled,
            is_admin: user.is_admin,
            is_banned: user.is_banned,
            echoes: user.echoes,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
        })
    } catch (error) {
        console.error('Get current user error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
