/**
 * GET /api/admin/audit-log
 * Get admin audit logs with filtering
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { detail: "Could not validate credentials" },
                { status: 401 }
            );
        }

        if (!currentUser.is_admin) {
            return NextResponse.json(
                { detail: "Admin access required" },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const adminId = searchParams.get("admin_id");
        const actionType = searchParams.get("action_type");
        const entityType = searchParams.get("entity_type");
        const fromDate = searchParams.get("from_date");
        const toDate = searchParams.get("to_date");
        const skip = parseInt(searchParams.get("skip") || "0");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

        // Build where clause
        const where: Prisma.AdminAuditLogWhereInput = {};

        if (adminId) {
            where.admin_id = adminId;
        }

        if (actionType) {
            where.action_type = actionType;
        }

        if (entityType) {
            where.entity_type = entityType;
        }

        if (fromDate || toDate) {
            where.created_at = {};
            if (fromDate) {
                where.created_at.gte = new Date(fromDate);
            }
            if (toDate) {
                where.created_at.lte = new Date(toDate);
            }
        }

        // Fetch logs with pagination
        const [logs, total] = await Promise.all([
            prisma.adminAuditLog.findMany({
                where,
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
            }),
            prisma.adminAuditLog.count({ where }),
        ]);

        // Get unique admins for filter dropdown
        const admins = await prisma.adminAuditLog.findMany({
            select: {
                admin_id: true,
                admin_name: true,
            },
            distinct: ["admin_id"],
        });

        return NextResponse.json({
            logs: logs.map((log) => ({
                id: log.id,
                admin_id: log.admin_id,
                admin_name: log.admin_name,
                action_type: log.action_type,
                entity_type: log.entity_type,
                entity_id: log.entity_id,
                entity_name: log.entity_name,
                details: log.details,
                created_at: log.created_at.toISOString(),
            })),
            total,
            admins: admins.map((a) => ({
                id: a.admin_id,
                name: a.admin_name,
            })),
        });
    } catch (error) {
        console.error("Get audit logs error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
