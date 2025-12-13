/**
 * GET /api/admin/professors
 * List all professors with pagination and search
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
        const lab = searchParams.get("lab");
        const skip = parseInt(searchParams.get("skip") || "0");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

        // Build where clause
        const where: {
            name?: { contains: string; mode: "insensitive" };
            lab?: string;
        } = {};

        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        if (lab && lab !== "ALL") {
            where.lab = lab;
        }

        // Fetch professors with course count
        const [professors, total] = await Promise.all([
            prisma.professor.findMany({
                where,
                orderBy: { name: "asc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { course_instructors: true },
                    },
                },
            }),
            prisma.professor.count({ where }),
        ]);

        // Get unique labs for filtering
        const labs = await prisma.professor.findMany({
            select: { lab: true },
            distinct: ["lab"],
            where: { lab: { not: null } },
        });

        return NextResponse.json({
            professors: professors.map((prof) => ({
                id: prof.id,
                name: prof.name,
                lab: prof.lab,
                review_summary: prof.review_summary,
                review_count: prof.review_count,
                average_rating: prof.average_rating.toString(),
                courses_count: prof._count.course_instructors,
                created_at: prof.created_at.toISOString(),
                updated_at: prof.updated_at.toISOString(),
            })),
            total,
            labs: labs.map((l) => l.lab).filter(Boolean),
        });
    } catch (error) {
        console.error("Get professors error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
