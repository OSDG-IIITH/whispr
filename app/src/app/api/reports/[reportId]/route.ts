/**
 * GET /api/reports/[reportId]/
 * Get a specific report.
 * 
 * PUT /api/reports/[reportId]/
 * Update a report (admin only - for reviewing reports).
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ reportId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { reportId } = await params

        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                reporter: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                reported_user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                review: {
                    select: {
                        id: true,
                        content: true,
                        rating: true,
                    },
                },
                reply: {
                    select: {
                        id: true,
                        content: true,
                    },
                },
            },
        })

        if (!report) {
            return NextResponse.json(
                { detail: 'Report not found' },
                { status: 404 }
            )
        }

        // Only reporter or admin can view the report
        if (report.reporter_id !== currentUser.id && !currentUser.is_admin) {
            return NextResponse.json(
                { detail: 'Not authorized' },
                { status: 403 }
            )
        }

        return NextResponse.json(report)
    } catch (error) {
        console.error('Get report error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ reportId: string }> }
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

        const { reportId } = await params
        const body = await request.json()
        const { status, admin_notes, admin_action } = body

        const report = await prisma.report.findUnique({
            where: { id: reportId },
        })

        if (!report) {
            return NextResponse.json(
                { detail: 'Report not found' },
                { status: 404 }
            )
        }

        const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed']
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { detail: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            )
        }

        const updatedReport = await prisma.report.update({
            where: { id: reportId },
            data: {
                status: status ?? report.status,
                admin_notes: admin_notes !== undefined ? admin_notes : report.admin_notes,
                admin_action: admin_action !== undefined ? admin_action : report.admin_action,
                reviewed_by: currentUser.username,
                reviewed_at: new Date(),
                updated_at: new Date(),
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                reported_user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        })

        return NextResponse.json(updatedReport)
    } catch (error) {
        console.error('Update report error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
