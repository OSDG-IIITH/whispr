/**
 * GET /api/admin/stats/
 * Get admin dashboard statistics (admin only).
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

        const [
            totalUsers,
            bannedUsers,
            pendingReports,
            underReviewReports,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { is_banned: true } }),
            prisma.report.count({ where: { status: 'pending' } }),
            prisma.report.count({ where: { status: 'under_review' } }),
        ])

        return NextResponse.json({
            total_users: totalUsers,
            banned_users: bannedUsers,
            pending_reports: pendingReports,
            under_review_reports: underReviewReports,
        })
    } catch (error) {
        console.error('Get admin stats error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
