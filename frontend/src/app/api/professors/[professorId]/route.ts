/**
 * GET /api/professors/[professorId]/
 * Get a specific professor by ID.
 * 
 * PUT /api/professors/[professorId]/ (Admin only)
 * Update a professor.
 * 
 * DELETE /api/professors/[professorId]/ (Admin only)
 * Delete a professor.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ professorId: string }> }
) {
    try {
        const { professorId } = await params

        const professor = await prisma.professor.findUnique({
            where: { id: professorId },
            include: {
                social_media: true,
                course_instructors: {
                    include: {
                        course: true,
                    },
                },
            },
        })

        if (!professor) {
            return NextResponse.json(
                { detail: 'Professor not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(professor)
    } catch (error) {
        console.error('Get professor error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ professorId: string }> }
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

        const { professorId } = await params
        const body = await request.json()

        const professor = await prisma.professor.findUnique({
            where: { id: professorId },
        })

        if (!professor) {
            return NextResponse.json(
                { detail: 'Professor not found' },
                { status: 404 }
            )
        }

        const updatedProfessor = await prisma.professor.update({
            where: { id: professorId },
            data: {
                name: body.name ?? professor.name,
                lab: body.lab !== undefined ? body.lab : professor.lab,
                updated_at: new Date(),
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

        return NextResponse.json(updatedProfessor)
    } catch (error) {
        console.error('Update professor error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ professorId: string }> }
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

        const { professorId } = await params

        const professor = await prisma.professor.findUnique({
            where: { id: professorId },
        })

        if (!professor) {
            return NextResponse.json(
                { detail: 'Professor not found' },
                { status: 404 }
            )
        }

        await prisma.professor.delete({
            where: { id: professorId },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Delete professor error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
