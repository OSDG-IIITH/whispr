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
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)

        const professors = await prisma.professor.findMany({
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
        })

        return NextResponse.json(professors)
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
