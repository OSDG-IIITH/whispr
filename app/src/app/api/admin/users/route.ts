/**
 * GET /api/admin/users/
 * Get all users with admin filtering options.
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser, requireAdminUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        try {
            requireAdminUser(currentUser)
        } catch {
            return NextResponse.json(
                { detail: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)
        const search = searchParams.get('search') || ''
        const bannedOnly = searchParams.get('banned_only') === 'true'
        const adminOnly = searchParams.get('admin_only') === 'true'

        // Build where clause
        const where: Prisma.UserWhereInput = {}

        if (search) {
            where.username = { contains: search, mode: 'insensitive' }
        }

        if (bannedOnly) {
            where.is_banned = true
        }

        if (adminOnly) {
            where.is_admin = true
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
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
                    ban_reason: true,
                    banned_until: true,
                    banned_by: true,
                    banned_at: true,
                    echoes: true,
                    created_at: true,
                    updated_at: true,
                },
                orderBy: { created_at: 'desc' },
            }),
            prisma.user.count({ where }),
        ])

        return NextResponse.json({
            users,
            total,
        })
    } catch (error) {
        console.error('Admin get users error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
