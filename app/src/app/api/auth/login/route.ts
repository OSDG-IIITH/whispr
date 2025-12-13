/**
 * POST /api/auth/login/
 * OAuth2 compatible token login, get an access token for future requests.
 * Uses username for authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createAccessToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        // Parse form data (OAuth2 compatible)
        const contentType = request.headers.get('content-type') || ''
        let username: string
        let password: string

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData()
            username = formData.get('username') as string
            password = formData.get('password') as string
        } else {
            const body = await request.json()
            username = body.username
            password = body.password
        }

        if (!username || !password) {
            return NextResponse.json(
                { detail: 'Username and password are required' },
                { status: 400 }
            )
        }

        // Authenticate user
        const user = await authenticateUser(username, password)
        if (!user) {
            return NextResponse.json(
                { detail: 'Incorrect username or password' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        // Check if user is banned
        if (user.is_banned) {
            const banMessage = user.banned_until
                ? `You are banned until ${user.banned_until.toISOString()}. Reason: ${user.ban_reason || 'No reason provided'}`
                : `You are permanently banned. Reason: ${user.ban_reason || 'No reason provided'}`
            return NextResponse.json(
                { detail: banMessage },
                { status: 403 }
            )
        }

        // Create access token
        const accessToken = createAccessToken(user.id)

        // Create response with auth cookie
        const response = NextResponse.json({
            access_token: accessToken,
            token_type: 'bearer',
        })

        response.headers.set('Set-Cookie', setAuthCookie(accessToken))

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { detail: 'An error occurred during login' },
            { status: 500 }
        )
    }
}
