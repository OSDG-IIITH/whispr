/**
 * Course Instructors Management API
 * 
 * GET /api/admin/course-instructors - List course-instructor links
 * POST /api/admin/course-instructors - Create a course-instructor link
 * DELETE /api/admin/course-instructors - Delete a course-instructor link
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
        const course_id = searchParams.get("course_id");
        const professor_id = searchParams.get("professor_id");

        const where: { course_id?: string; professor_id?: string } = {};
        if (course_id) where.course_id = course_id;
        if (professor_id) where.professor_id = professor_id;

        const courseInstructors = await prisma.courseInstructor.findMany({
            where,
            include: {
                course: {
                    select: { id: true, code: true, name: true },
                },
                professor: {
                    select: { id: true, name: true, lab: true },
                },
            },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json({
            course_instructors: courseInstructors.map((ci) => ({
                id: ci.id,
                course_id: ci.course_id,
                professor_id: ci.professor_id,
                semester: ci.semester,
                year: ci.year,
                course: ci.course,
                professor: ci.professor,
                created_at: ci.created_at.toISOString(),
            })),
        });
    } catch (error) {
        console.error("Get course instructors error:", error);
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
        const { course_id, professor_id, semester, year } = body;

        if (!course_id || !professor_id) {
            return NextResponse.json(
                { detail: "course_id and professor_id are required" },
                { status: 400 }
            );
        }

        // Verify course and professor exist
        const [course, professor] = await Promise.all([
            prisma.course.findUnique({ where: { id: course_id } }),
            prisma.professor.findUnique({ where: { id: professor_id } }),
        ]);

        if (!course) {
            return NextResponse.json(
                { detail: "Course not found" },
                { status: 404 }
            );
        }

        if (!professor) {
            return NextResponse.json(
                { detail: "Professor not found" },
                { status: 404 }
            );
        }

        // Check for existing link
        const existing = await prisma.courseInstructor.findFirst({
            where: {
                course_id,
                professor_id,
                semester: semester || null,
                year: year || null,
            },
        });

        if (existing) {
            return NextResponse.json(
                { detail: "This course-professor link already exists" },
                { status: 409 }
            );
        }

        const courseInstructor = await prisma.courseInstructor.create({
            data: {
                course_id,
                professor_id,
                semester: semester || null,
                year: year || null,
            },
            include: {
                course: { select: { id: true, code: true, name: true } },
                professor: { select: { id: true, name: true, lab: true } },
            },
        });

        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "CREATE",
            entityType: "COURSE_INSTRUCTOR",
            entityId: courseInstructor.id,
            entityName: `${course.code} - ${professor.name}`,
            details: { course_id, professor_id, semester, year },
        });

        return NextResponse.json({
            id: courseInstructor.id,
            course_id: courseInstructor.course_id,
            professor_id: courseInstructor.professor_id,
            semester: courseInstructor.semester,
            year: courseInstructor.year,
            course: courseInstructor.course,
            professor: courseInstructor.professor,
            created_at: courseInstructor.created_at.toISOString(),
        }, { status: 201 });
    } catch (error) {
        console.error("Create course instructor error:", error);
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

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { detail: "Course instructor id is required" },
                { status: 400 }
            );
        }

        const courseInstructor = await prisma.courseInstructor.findUnique({
            where: { id },
            include: {
                course: { select: { code: true } },
                professor: { select: { name: true } },
            },
        });

        if (!courseInstructor) {
            return NextResponse.json(
                { detail: "Course instructor not found" },
                { status: 404 }
            );
        }

        await prisma.courseInstructor.delete({ where: { id } });

        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "DELETE",
            entityType: "COURSE_INSTRUCTOR",
            entityId: id,
            entityName: `${courseInstructor.course.code} - ${courseInstructor.professor.name}`,
        });

        return NextResponse.json({ message: "Course instructor deleted" });
    } catch (error) {
        console.error("Delete course instructor error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
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
        const { id, semester, year } = body;

        if (!id) {
            return NextResponse.json(
                { detail: "Course instructor id is required" },
                { status: 400 }
            );
        }

        const courseInstructor = await prisma.courseInstructor.findUnique({
            where: { id },
            include: {
                course: { select: { id: true, code: true, name: true } },
                professor: { select: { id: true, name: true, lab: true } },
            },
        });

        if (!courseInstructor) {
            return NextResponse.json(
                { detail: "Course instructor not found" },
                { status: 404 }
            );
        }

        const updated = await prisma.courseInstructor.update({
            where: { id },
            data: {
                semester: semester || null,
                year: year ? parseInt(year, 10) : null,
            },
            include: {
                course: { select: { id: true, code: true, name: true } },
                professor: { select: { id: true, name: true, lab: true } },
            },
        });

        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "UPDATE",
            entityType: "COURSE_INSTRUCTOR",
            entityId: id,
            entityName: `${updated.course.code} - ${updated.professor.name}`,
            details: { semester, year },
        });

        return NextResponse.json({
            id: updated.id,
            course_id: updated.course_id,
            professor_id: updated.professor_id,
            semester: updated.semester,
            year: updated.year,
            course: updated.course,
            professor: updated.professor,
            created_at: updated.created_at.toISOString(),
        });
    } catch (error) {
        console.error("Update course instructor error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
