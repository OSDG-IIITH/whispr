/**
 * POST /api/auth/logout/
 * Logout the current user by clearing the auth cookie.
 */

import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
    const response = NextResponse.json({ message: 'Successfully logged out' })
    response.headers.set('Set-Cookie', clearAuthCookie())
    return response
}
