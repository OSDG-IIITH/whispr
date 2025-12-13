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
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)

        const courses = await prisma.course.findMany({
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
        })

        return NextResponse.json(courses, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
