/**
 * GET /api/courses/
 * Retrieve courses with optional pagination.
 * 
 * POST /api/courses/ (Admin only)
 * Create a new course.
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
        const semester = searchParams.get('semester') || ''
        const year = searchParams.get('year') || ''

        // Build where clause
        interface WhereClause {
            OR?: { code?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' } }[];
            course_instructors?: { some: { semester?: string; year?: number } };
        }

        const where: WhereClause = {}

        // Search filter
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Semester/year filter via course_instructors
        if (semester || year) {
            const ciFilter: { semester?: string; year?: number } = {}
            if (semester) ciFilter.semester = semester
            if (year) ciFilter.year = parseInt(year, 10)
            where.course_instructors = { some: ciFilter }
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                include: {
                    course_instructors: {
                        include: {
                            professor: true,
                        },
                    },
                },
                orderBy: { code: 'asc' },
            }),
            prisma.course.count({ where }),
        ])

        return NextResponse.json({
            courses,
            total,
            skip,
            limit,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        })
    } catch (error) {
        console.error('Get courses error:', error)
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
        const { code, name, credits, description, official_document_url } = body

        if (!code || !name) {
            return NextResponse.json(
                { detail: 'Course code and name are required' },
                { status: 400 }
            )
        }

        // Check if course with this code already exists
        const existingCourse = await prisma.course.findUnique({
            where: { code },
        })

        if (existingCourse) {
            return NextResponse.json(
                { detail: 'Course with this code already exists' },
                { status: 400 }
            )
        }

        const course = await prisma.course.create({
            data: {
                code,
                name,
                credits: credits || null,
                description: description || null,
                official_document_url: official_document_url || null,
            },
            include: {
                course_instructors: {
                    include: {
                        professor: true,
                    },
                },
            },
        })

        return NextResponse.json(course, { status: 201 })
    } catch (error) {
        console.error('Create course error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
