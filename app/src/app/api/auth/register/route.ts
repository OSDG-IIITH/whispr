/**
 * POST /api/auth/register/
 * Register a new user and automatically log them in.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, createAccessToken, setAuthCookie } from '@/lib/auth'

interface RegisterBody {
    username: string
    password: string
    bio?: string
    student_since_year?: number
}

export async function POST(request: NextRequest) {
    try {
        const body: RegisterBody = await request.json()
        const { username, password, bio, student_since_year } = body

        // Validate required fields
        if (!username || !password) {
            return NextResponse.json(
                { detail: 'Username and password are required' },
                { status: 400 }
            )
        }

        // Validate username format
        if (username.length < 3 || username.length > 50) {
            return NextResponse.json(
                { detail: 'Username must be between 3 and 50 characters' },
                { status: 400 }
            )
        }

        // Validate password length
        const minPasswordLength = parseInt(process.env.MIN_PASSWORD_LENGTH || '8', 10)
        if (password.length < minPasswordLength) {
            return NextResponse.json(
                { detail: `Password must be at least ${minPasswordLength} characters` },
                { status: 400 }
            )
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username },
        })

        if (existingUser) {
            return NextResponse.json(
                { detail: 'Username already registered' },
                { status: 400 }
            )
        }

        // Create the user
        const hashedPassword = hashPassword(password)
        const now = new Date()

        const user = await prisma.user.create({
            data: {
                username,
                hashed_password: hashedPassword,
                bio: bio || null,
                student_since_year: student_since_year || null,
                is_muffled: true, // Default to muffled until email verification
                is_admin: false,
                is_banned: false,
                echoes: 0,
                created_at: now,
                updated_at: now,
            },
        })

        // Create access token
        const accessToken = createAccessToken(user.id)

        // Create response with auth cookie
        const response = NextResponse.json(
            {
                access_token: accessToken,
                token_type: 'bearer',
            },
            { status: 201 }
        )

        response.headers.set('Set-Cookie', setAuthCookie(accessToken))

        return response
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { detail: 'An error occurred during registration' },
            { status: 500 }
        )
    }
}
