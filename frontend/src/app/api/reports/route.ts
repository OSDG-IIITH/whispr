/**
 * GET /api/reports/
 * Retrieve reports (admin only).
 * 
 * POST /api/reports/
 * Create a new report.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
        const status = searchParams.get('status')
        const reportType = searchParams.get('report_type')

        const where: {
            status?: string
            report_type?: string
        } = {}
        if (status) where.status = status
        if (reportType) where.report_type = reportType

        const reports = await prisma.report.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
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
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
                reply: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json(reports)
    } catch (error) {
        console.error('Get reports error:', error)
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

        const body = await request.json()
        const { review_id, reply_id, reported_user_id, report_type, reason } = body

        // Validate that exactly one target is specified
        const targets = [review_id, reply_id, reported_user_id].filter(Boolean)
        if (targets.length !== 1) {
            return NextResponse.json(
                { detail: 'Must specify exactly one of: review_id, reply_id, or reported_user_id' },
                { status: 400 }
            )
        }

        if (!report_type || !['spam', 'harassment', 'inappropriate', 'misinformation', 'other'].includes(report_type)) {
            return NextResponse.json(
                { detail: 'Invalid report type' },
                { status: 400 }
            )
        }

        if (!reason || reason.trim().length === 0) {
            return NextResponse.json(
                { detail: 'Reason is required' },
                { status: 400 }
            )
        }

        const report = await prisma.report.create({
            data: {
                reporter_id: currentUser.id,
                review_id: review_id || null,
                reply_id: reply_id || null,
                reported_user_id: reported_user_id || null,
                report_type,
                reason: reason.trim(),
                status: 'pending',
            },
        })

        return NextResponse.json(report, { status: 201 })
    } catch (error) {
        console.error('Create report error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
