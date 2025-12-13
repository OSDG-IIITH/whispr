/**
 * GET /api/users/stats/
 * Get user statistics for the community.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    try {
        const [totalUsers, verifiedUsers, echoesResult] = await Promise.all([
            prisma.user.count({
                where: { is_banned: false },
            }),
            prisma.user.count({
                where: { is_banned: false, is_muffled: false },
            }),
            prisma.user.aggregate({
                where: { is_banned: false },
                _sum: { echoes: true },
                _avg: { echoes: true },
            }),
        ])

        return NextResponse.json({
            total_users: totalUsers,
            verified_users: verifiedUsers,
            total_echoes: echoesResult._sum.echoes || 0,
            average_echoes: Math.round((echoesResult._avg.echoes || 0) * 10) / 10,
        })
    } catch (error) {
        console.error('User stats error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
