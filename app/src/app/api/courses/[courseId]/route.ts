/**
 * GET /api/courses/[courseId]/
 * Get a specific course by ID.
 * 
 * PUT /api/courses/[courseId]/ (Admin only)
 * Update a course.
 * 
 * DELETE /api/courses/[courseId]/ (Admin only)
 * Delete a course.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params

        const course = await prisma.course.findUnique({
            where: { id: courseId },
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
        console.error('Get course error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
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

        const { courseId } = await params
        const body = await request.json()

        const course = await prisma.course.findUnique({
            where: { id: courseId },
        })

        if (!course) {
            return NextResponse.json(
                { detail: 'Course not found' },
                { status: 404 }
            )
        }

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                name: body.name ?? course.name,
                credits: body.credits !== undefined ? body.credits : course.credits,
                description: body.description !== undefined ? body.description : course.description,
                official_document_url: body.official_document_url !== undefined ? body.official_document_url : course.official_document_url,
                updated_at: new Date(),
            },
            include: {
                course_instructors: {
                    include: {
                        professor: true,
                    },
                },
            },
        })

        return NextResponse.json(updatedCourse)
    } catch (error) {
        console.error('Update course error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
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

        const { courseId } = await params

        const course = await prisma.course.findUnique({
            where: { id: courseId },
        })

        if (!course) {
            return NextResponse.json(
                { detail: 'Course not found' },
                { status: 404 }
            )
        }

        await prisma.course.delete({
            where: { id: courseId },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Delete course error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
