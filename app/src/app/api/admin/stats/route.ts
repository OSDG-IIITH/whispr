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
            verifiedUsers,
            bannedUsers,
            totalReviews,
            totalReplies,
            totalCourses,
            totalProfessors,
            pendingReports,
            totalReports,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { is_muffled: false } }),
            prisma.user.count({ where: { is_banned: true } }),
            prisma.review.count(),
            prisma.reply.count(),
            prisma.course.count(),
            prisma.professor.count(),
            prisma.report.count({ where: { status: 'pending' } }),
            prisma.report.count(),
        ])

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const [recentUsers, recentReviews, recentReports] = await Promise.all([
            prisma.user.count({ where: { created_at: { gte: sevenDaysAgo } } }),
            prisma.review.count({ where: { created_at: { gte: sevenDaysAgo } } }),
            prisma.report.count({ where: { created_at: { gte: sevenDaysAgo } } }),
        ])

        return NextResponse.json({
            users: {
                total: totalUsers,
                verified: verifiedUsers,
                banned: bannedUsers,
                recent: recentUsers,
            },
            content: {
                reviews: totalReviews,
                replies: totalReplies,
                courses: totalCourses,
                professors: totalProfessors,
                recent_reviews: recentReviews,
            },
            reports: {
                total: totalReports,
                pending: pendingReports,
                recent: recentReports,
            },
        })
    } catch (error) {
        console.error('Get admin stats error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
