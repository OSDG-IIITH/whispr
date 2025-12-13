/**
 * PUT /api/admin/reports/[reportId]/action
 * Take action on a report (update status, add notes, ban user, etc.)
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser, requireAdminUser } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit-logger'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ reportId: string }> }
) {
    try {
        const { reportId } = await params
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        try {
            requireAdminUser(currentUser)
        } catch {
            return NextResponse.json(
                { detail: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { status, action, notes, ban_duration_days } = body

        // Find the report
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                reported_user: true,
            },
        })

        if (!report) {
            return NextResponse.json(
                { detail: 'Report not found' },
                { status: 404 }
            )
        }

        // Update the report
        const updateData: {
            status?: string
            admin_notes?: string
            reviewed_by?: string
            reviewed_at?: Date
            admin_action?: string
            updated_at: Date
        } = {
            updated_at: new Date(),
        }

        if (status) {
            updateData.status = status
        }

        if (notes) {
            updateData.admin_notes = notes
        }

        if (action) {
            updateData.admin_action = action
            updateData.reviewed_by = currentUser.username
            updateData.reviewed_at = new Date()
        }

        await prisma.report.update({
            where: { id: reportId },
            data: updateData,
        })

        // Determine the audit action type based on status/action
        let auditActionType: 'REPORT_RESOLVE' | 'REPORT_DISMISS' = 'REPORT_RESOLVE'
        if (status === 'dismissed') {
            auditActionType = 'REPORT_DISMISS'
        }

        // If action is to ban the reported user
        if (action === 'ban' && report.reported_user_id) {
            const bannedUntil = ban_duration_days
                ? new Date(Date.now() + ban_duration_days * 24 * 60 * 60 * 1000)
                : null

            await prisma.user.update({
                where: { id: report.reported_user_id },
                data: {
                    is_banned: true,
                    ban_reason: `Banned due to report: ${report.reason}`,
                    banned_until: bannedUntil,
                    banned_by: currentUser.username,
                    banned_at: new Date(),
                    updated_at: new Date(),
                },
            })

            // Also log the ban action
            await logAdminAction({
                adminId: currentUser.id,
                adminName: currentUser.username,
                actionType: 'BAN',
                entityType: 'USER',
                entityId: report.reported_user_id,
                entityName: report.reported_user?.username,
                details: {
                    reason: `Banned due to report: ${report.reason}`,
                    duration_days: ban_duration_days || 'permanent',
                    banned_until: bannedUntil?.toISOString() || null,
                    via_report_id: reportId,
                },
            })
        }

        // If action is to warn (mute) the user
        if (action === 'warn' && report.reported_user_id) {
            await prisma.user.update({
                where: { id: report.reported_user_id },
                data: {
                    is_muffled: true,
                    updated_at: new Date(),
                },
            })
        }

        // If action is to delete the reported content
        if (action === 'delete_content') {
            if (report.review_id) {
                await prisma.review.delete({
                    where: { id: report.review_id },
                }).catch(() => {
                    // Content may already be deleted
                })
            }
            if (report.reply_id) {
                await prisma.reply.delete({
                    where: { id: report.reply_id },
                }).catch(() => {
                    // Content may already be deleted
                })
            }
        }

        // Log the report action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: auditActionType,
            entityType: 'REPORT',
            entityId: reportId,
            entityName: report.reason?.slice(0, 50),
            details: {
                status: status,
                action: action,
                notes: notes,
                reported_user: report.reported_user?.username,
            },
        })

        return NextResponse.json({
            message: 'Report action completed successfully',
        })
    } catch (error) {
        console.error('Report action error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
