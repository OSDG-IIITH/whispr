/**
 * POST /api/admin/users/[userId]/reset-password
 * Reset a user's password to a random temporary password
 * Admin only
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

// Generate a random alphanumeric password
function generateTempPassword(length: number = 12): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
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

        const { userId } = await params;

        // Find the target user
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return NextResponse.json(
                { detail: "User not found" },
                { status: 404 }
            );
        }

        // Prevent admins from resetting their own password via this endpoint
        if (targetUser.id === currentUser.id) {
            return NextResponse.json(
                { detail: "Cannot reset your own password via admin panel. Use account settings instead." },
                { status: 400 }
            );
        }

        // Generate and hash new password
        const tempPassword = generateTempPassword();
        const hashedPassword = hashPassword(tempPassword);

        // Update the user's password
        await prisma.user.update({
            where: { id: userId },
            data: { hashed_password: hashedPassword },
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "UPDATE",
            entityType: "USER",
            entityId: targetUser.id,
            entityName: targetUser.username,
            details: { action: "password_reset" },
        });

        return NextResponse.json({
            message: "Password reset successfully",
            temporary_password: tempPassword,
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
