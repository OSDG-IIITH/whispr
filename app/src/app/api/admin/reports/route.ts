/**
 * GET /api/admin/reports/
 * Get all reports with filters (admin only).
 * 
 * PUT /api/admin/reports/
 * Bulk update reports (admin only).
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

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
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
                            is_banned: true,
                        },
                    },
                    review: {
                        select: {
                            id: true,
                            content: true,
                            rating: true,
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
            }),
            prisma.report.count({ where }),
        ])

        return NextResponse.json(reports)
    } catch (error) {
        console.error('Get admin reports error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
