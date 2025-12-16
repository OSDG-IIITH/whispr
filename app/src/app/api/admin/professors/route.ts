/**
 * GET /api/admin/professors - List all professors with pagination and search
 * POST /api/admin/professors - Create a new professor
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

/**
 * POST /api/admin/professors
 * Create a new professor
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
        const { name, lab, course_ids } = body;

        // Validate required fields
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { detail: "Professor name is required" },
                { status: 400 }
            );
        }

        const trimmedName = name.trim();

        // Check for duplicate professor name (case-insensitive)
        const existingProfessor = await prisma.professor.findFirst({
            where: {
                name: { equals: trimmedName, mode: "insensitive" },
            },
        });

        if (existingProfessor) {
            return NextResponse.json(
                { detail: `A professor named "${existingProfessor.name}" already exists` },
                { status: 409 }
            );
        }

        // Validate course IDs if provided
        const validCourseIds: string[] = [];
        if (course_ids && Array.isArray(course_ids) && course_ids.length > 0) {
            const courses = await prisma.course.findMany({
                where: { id: { in: course_ids } },
                select: { id: true },
            });
            validCourseIds.push(...courses.map(c => c.id));
        }

        // Create the professor and course_instructors in a transaction
        const professor = await prisma.$transaction(async (tx) => {
            const newProfessor = await tx.professor.create({
                data: {
                    name: trimmedName,
                    lab: lab?.trim() || null,
                },
            });

            // Create course_instructor entries for each course
            if (validCourseIds.length > 0) {
                await tx.courseInstructor.createMany({
                    data: validCourseIds.map(courseId => ({
                        professor_id: newProfessor.id,
                        course_id: courseId,
                    })),
                    skipDuplicates: true,
                });
            }

            return newProfessor;
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "CREATE",
            entityType: "PROFESSOR",
            entityId: professor.id,
            entityName: professor.name,
            details: {
                lab: professor.lab,
                courses_linked: validCourseIds.length,
            },
        });

        return NextResponse.json({
            id: professor.id,
            name: professor.name,
            lab: professor.lab,
            review_summary: professor.review_summary,
            review_count: professor.review_count,
            average_rating: professor.average_rating.toString(),
            courses_count: validCourseIds.length,
            created_at: professor.created_at.toISOString(),
            updated_at: professor.updated_at.toISOString(),
        }, { status: 201 });
    } catch (error) {
        console.error("Create professor error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
