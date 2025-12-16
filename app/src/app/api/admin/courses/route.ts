/**
 * GET /api/admin/courses - List all courses with pagination and search
 * POST /api/admin/courses - Create a new course
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

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

/**
 * POST /api/admin/courses
 * Create a new course
 */
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
        const { code, name, credits, description, professor_ids } = body;

        // Validate required fields
        if (!code || typeof code !== "string" || code.trim().length === 0) {
            return NextResponse.json(
                { detail: "Course code is required" },
                { status: 400 }
            );
        }

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { detail: "Course name is required" },
                { status: 400 }
            );
        }

        const trimmedCode = code.trim().toUpperCase();
        const trimmedName = name.trim();

        // Check for duplicate course code (unique constraint)
        const existingCourse = await prisma.course.findUnique({
            where: { code: trimmedCode },
        });

        if (existingCourse) {
            return NextResponse.json(
                { detail: `A course with code "${trimmedCode}" already exists` },
                { status: 409 }
            );
        }

        // Validate professor IDs if provided
        const validProfessorIds: string[] = [];
        if (professor_ids && Array.isArray(professor_ids) && professor_ids.length > 0) {
            const professors = await prisma.professor.findMany({
                where: { id: { in: professor_ids } },
                select: { id: true },
            });
            validProfessorIds.push(...professors.map(p => p.id));
        }

        // Create the course and course_instructors in a transaction
        const course = await prisma.$transaction(async (tx) => {
            const newCourse = await tx.course.create({
                data: {
                    code: trimmedCode,
                    name: trimmedName,
                    credits: credits ? parseInt(credits, 10) : null,
                    description: description?.trim() || null,
                },
            });

            // Create course_instructor entries for each professor
            if (validProfessorIds.length > 0) {
                await tx.courseInstructor.createMany({
                    data: validProfessorIds.map(professorId => ({
                        course_id: newCourse.id,
                        professor_id: professorId,
                    })),
                    skipDuplicates: true,
                });
            }

            return newCourse;
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "CREATE",
            entityType: "COURSE",
            entityId: course.id,
            entityName: `${course.code} - ${course.name}`,
            details: {
                code: course.code,
                name: course.name,
                credits: course.credits,
                professors_linked: validProfessorIds.length,
            },
        });

        return NextResponse.json({
            id: course.id,
            code: course.code,
            name: course.name,
            credits: course.credits,
            description: course.description,
            official_document_url: course.official_document_url,
            review_summary: course.review_summary,
            review_count: course.review_count,
            average_rating: course.average_rating.toString(),
            instructors_count: validProfessorIds.length,
            created_at: course.created_at.toISOString(),
            updated_at: course.updated_at.toISOString(),
        }, { status: 201 });
    } catch (error) {
        console.error("Create course error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
