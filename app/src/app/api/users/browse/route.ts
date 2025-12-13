/**
 * GET /api/users/browse/
 * Browse users with advanced filtering and sorting.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)
        const search = searchParams.get('search') || ''
        const sortBy = searchParams.get('sort_by') || 'echoes'
        const order = searchParams.get('order') || 'desc'
        const minEchoes = searchParams.get('min_echoes')
        const isVerified = searchParams.get('is_verified')

        // Build where clause
        const where: Prisma.UserWhereInput = {
            is_banned: false,
        }

        // Search filter
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Min echoes filter
        if (minEchoes) {
            where.echoes = { gte: parseInt(minEchoes, 10) }
        }

        // Verified filter (is_muffled = false means verified)
        if (isVerified !== null && isVerified !== undefined) {
            if (isVerified === 'true') {
                where.is_muffled = false
            } else if (isVerified === 'false') {
                where.is_muffled = true
            }
        }

        // Build orderBy
        const validSortFields = ['echoes', 'username', 'created_at']
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'echoes'
        const sortOrder = order === 'asc' ? 'asc' : 'desc'

        const orderBy: Prisma.UserOrderByWithRelationInput = {
            [sortField]: sortOrder,
        }

        const users = await prisma.user.findMany({
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
                echoes: true,
                created_at: true,
                updated_at: true,
            },
            orderBy,
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Browse users error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
