/**
 * GET /api/professors/
 * Retrieve professors with optional pagination.
 * 
 * POST /api/professors/ (Admin only)
 * Create a new professor.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
        const search = searchParams.get('search') || ''
        const lab = searchParams.get('lab') || ''

        // Build where clause
        interface WhereClause {
            OR?: { name?: { contains: string; mode: 'insensitive' }; lab?: { contains: string; mode: 'insensitive' } }[];
            lab?: string;
        }

        const where: WhereClause = {}

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { lab: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Lab filter
        if (lab) {
            where.lab = lab
        }

        const [professors, total] = await Promise.all([
            prisma.professor.findMany({
                where,
                skip,
                take: limit,
                include: {
                    social_media: true,
                    course_instructors: {
                        include: {
                            course: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.professor.count({ where }),
        ])

        // Get unique labs for filter dropdown
        const allLabs = await prisma.professor.findMany({
            select: { lab: true },
            distinct: ['lab'],
            where: { lab: { not: null } },
        })
        const labs = allLabs.map(p => p.lab).filter(Boolean) as string[]

        return NextResponse.json({
            professors,
            total,
            skip,
            limit,
            labs,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        })
    } catch (error) {
        console.error('Get professors error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        if (!currentUser.is_admin) {
            return NextResponse.json(
                { detail: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { name, lab, social_media } = body

        if (!name) {
            return NextResponse.json(
                { detail: 'Professor name is required' },
                { status: 400 }
            )
        }

        const professor = await prisma.professor.create({
            data: {
                name,
                lab: lab || null,
                social_media: social_media ? {
                    create: social_media.map((sm: { platform: string; url: string }) => ({
                        platform: sm.platform,
                        url: sm.url,
                    })),
                } : undefined,
            },
            include: {
                social_media: true,
                course_instructors: {
                    include: {
                        course: true,
                    },
                },
            },
        })

        return NextResponse.json(professor, { status: 201 })
    } catch (error) {
        console.error('Create professor error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
