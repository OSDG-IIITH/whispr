/**
 * GET /api/verify/status/
 * Get verification status for current user.
 */

import { NextRequest, NextResponse } from 'next/server'
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

        return NextResponse.json({
            is_muffled: currentUser.is_muffled,
            username: currentUser.username,
            echoes: currentUser.echoes,
        })
    } catch (error) {
        console.error('Get verification status error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
