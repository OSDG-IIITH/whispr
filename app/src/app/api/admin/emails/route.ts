/**
 * GET /api/admin/emails - List all registered IIITH emails with pagination
 * POST /api/admin/emails - Add a new email
 * DELETE /api/admin/emails - Delete an email by ID (body: { id: string })
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

// Valid IIITH email domains
const VALID_EMAIL_DOMAINS = ["@iiit.ac.in", "@students.iiit.ac.in", "@research.iiit.ac.in"];

function isValidIIITHEmail(email: string): boolean {
    return VALID_EMAIL_DOMAINS.some(domain => email.toLowerCase().endsWith(domain));
}

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
        const search = searchParams.get("search") || "";
        const skip = parseInt(searchParams.get("skip") || "0");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

        // Build where clause
        const where = search
            ? { email: { contains: search, mode: "insensitive" as const } }
            : {};

        const [emails, total] = await Promise.all([
            prisma.usedEmail.findMany({
                where,
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
            }),
            prisma.usedEmail.count({ where }),
        ]);

        return NextResponse.json({
            emails: emails.map((e) => ({
                id: e.id,
                email: e.email,
                verified_at: e.verified_at?.toISOString() || null,
                created_at: e.created_at.toISOString(),
            })),
            total,
        });
    } catch (error) {
        console.error("Get emails error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { detail: "Email is required" },
                { status: 400 }
            );
        }

        const trimmedEmail = email.trim().toLowerCase();

        // Validate email format
        if (!isValidIIITHEmail(trimmedEmail)) {
            return NextResponse.json(
                { detail: "Email must be a valid IIITH email (@iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in)" },
                { status: 400 }
            );
        }

        // Check for duplicate
        const existing = await prisma.usedEmail.findUnique({
            where: { email: trimmedEmail },
        });

        if (existing) {
            return NextResponse.json(
                { detail: "This email is already registered" },
                { status: 409 }
            );
        }

        // Create the email entry
        const newEmail = await prisma.usedEmail.create({
            data: {
                email: trimmedEmail,
            },
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "CREATE",
            entityType: "USER", // Using USER since there's no EMAIL entity type
            entityId: newEmail.id,
            entityName: newEmail.email,
            details: { action: "add_email" },
        });

        return NextResponse.json({
            id: newEmail.id,
            email: newEmail.email,
            verified_at: null,
            created_at: newEmail.created_at.toISOString(),
        }, { status: 201 });
    } catch (error) {
        console.error("Add email error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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

        const body = await request.json();
        const { id } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { detail: "Email ID is required" },
                { status: 400 }
            );
        }

        // Find the email
        const emailRecord = await prisma.usedEmail.findUnique({
            where: { id },
        });

        if (!emailRecord) {
            return NextResponse.json(
                { detail: "Email not found" },
                { status: 404 }
            );
        }

        // Delete the email
        await prisma.usedEmail.delete({
            where: { id },
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "DELETE",
            entityType: "USER",
            entityId: id,
            entityName: emailRecord.email,
            details: { action: "delete_email" },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete email error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
