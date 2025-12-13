/**
 * GET /api/admin/courses
 * List all courses with pagination and search
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
        const skip = parseInt(searchParams.get("skip") || "0");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

        // Build where clause for search
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { code: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {};

        // Fetch courses with instructor count
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                orderBy: { code: "asc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { course_instructors: true },
                    },
                },
            }),
            prisma.course.count({ where }),
        ]);

        return NextResponse.json({
            courses: courses.map((course) => ({
                id: course.id,
                code: course.code,
                name: course.name,
                credits: course.credits,
                description: course.description,
                official_document_url: course.official_document_url,
                review_summary: course.review_summary,
                review_count: course.review_count,
                average_rating: course.average_rating.toString(),
                instructors_count: course._count.course_instructors,
                created_at: course.created_at.toISOString(),
                updated_at: course.updated_at.toISOString(),
            })),
            total,
        });
    } catch (error) {
        console.error("Get courses error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
