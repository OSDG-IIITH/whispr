/**
 * GET /api/courses/by-code/[code]/
 * Get a course by its code.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params

        const course = await prisma.course.findUnique({
            where: { code },
            include: {
                course_instructors: {
                    include: {
                        professor: true,
                    },
                },
            },
        })

        if (!course) {
            return NextResponse.json(
                { detail: 'Course not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(course)
    } catch (error) {
        console.error('Get course by code error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
