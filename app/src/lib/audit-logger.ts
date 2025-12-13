/**
 * Server-side audit logging utility for admin actions
 */
import prisma from "@/lib/db";
import { AuditActionType, AuditEntityType } from "@/types/admin-models";
import { Prisma } from "@prisma/client";

interface AuditLogParams {
    adminId: string;
    adminName: string;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityId?: string;
    entityName?: string;
    details?: Record<string, unknown>;
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction({
    adminId,
    adminName,
    actionType,
    entityType,
    entityId,
    entityName,
    details,
}: AuditLogParams): Promise<void> {
    try {
        await prisma.adminAuditLog.create({
            data: {
                admin_id: adminId,
                admin_name: adminName,
                action_type: actionType,
                entity_type: entityType,
                entity_id: entityId ?? null,
                entity_name: entityName ?? null,
                details: details as Prisma.InputJsonValue | undefined,
            },
        });
    } catch (error) {
        // Log error but don't fail the main operation
        console.error("Failed to create audit log entry:", error);
    }
}

/**
 * Generate a human-readable description of an audit action
 */
export function getAuditActionDescription(
    actionType: AuditActionType,
    entityType: AuditEntityType,
    entityName?: string
): string {
    const entity = entityName ? `"${entityName}"` : entityType.toLowerCase();

    switch (actionType) {
        case "CREATE":
            return `Created ${entityType.toLowerCase()} ${entity}`;
        case "UPDATE":
            return `Updated ${entityType.toLowerCase()} ${entity}`;
        case "DELETE":
            return `Deleted ${entityType.toLowerCase()} ${entity}`;
        case "MERGE":
            return `Merged ${entityType.toLowerCase()} ${entity}`;
        case "BAN":
            return `Banned user ${entity}`;
        case "UNBAN":
            return `Unbanned user ${entity}`;
        case "MAKE_ADMIN":
            return `Granted admin privileges to ${entity}`;
        case "REMOVE_ADMIN":
            return `Removed admin privileges from ${entity}`;
        case "REPORT_DISMISS":
            return `Dismissed report ${entity}`;
        case "REPORT_RESOLVE":
            return `Resolved report ${entity}`;
        default:
            return `${actionType} ${entityType.toLowerCase()} ${entity}`;
    }
}
