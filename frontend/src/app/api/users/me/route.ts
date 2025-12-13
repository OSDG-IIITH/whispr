/**
 * GET /api/users/me/
 * PUT /api/users/me/
 * Get or update current user information.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

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

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const body = await request.json()
        const { username, bio, student_since_year, password } = body

        // Build update data
        const updateData: {
            username?: string
            bio?: string | null
            student_since_year?: number | null
            hashed_password?: string
            updated_at: Date
        } = {
            updated_at: new Date(),
        }

        // Update username if provided
        if (username && username !== user.username) {
            // Check if username is already taken
            const existingUser = await prisma.user.findUnique({
                where: { username },
            })
            if (existingUser) {
                return NextResponse.json(
                    { detail: 'Username already taken' },
                    { status: 400 }
                )
            }
            updateData.username = username
        }

        if (bio !== undefined) {
            updateData.bio = bio
        }

        if (student_since_year !== undefined) {
            updateData.student_since_year = student_since_year
        }

        if (password) {
            const minPasswordLength = parseInt(process.env.MIN_PASSWORD_LENGTH || '8', 10)
            if (password.length < minPasswordLength) {
                return NextResponse.json(
                    { detail: `Password must be at least ${minPasswordLength} characters` },
                    { status: 400 }
                )
            }
            updateData.hashed_password = hashPassword(password)
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
        })

        return NextResponse.json({
            id: updatedUser.id,
            username: updatedUser.username,
            bio: updatedUser.bio,
            student_since_year: updatedUser.student_since_year,
            is_muffled: updatedUser.is_muffled,
            is_admin: updatedUser.is_admin,
            is_banned: updatedUser.is_banned,
            echoes: updatedUser.echoes,
            created_at: updatedUser.created_at.toISOString(),
            updated_at: updatedUser.updated_at.toISOString(),
        })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
