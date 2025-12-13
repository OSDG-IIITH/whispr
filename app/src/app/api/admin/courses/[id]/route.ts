/**
 * GET/PUT/DELETE /api/admin/courses/[id]
 * Get, update, or delete a specific course
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

        const { id } = await params;

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                course_instructors: {
                    include: {
                        professor: {
                            select: { id: true, name: true, lab: true },
                        },
                    },
                },
                reviews: {
                    select: { id: true },
                },
            },
        });

        if (!course) {
            return NextResponse.json(
                { detail: "Course not found" },
                { status: 404 }
            );
        }

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
            created_at: course.created_at.toISOString(),
            updated_at: course.updated_at.toISOString(),
            instructors: course.course_instructors.map((ci) => ({
                id: ci.id,
                professor_id: ci.professor.id,
                professor_name: ci.professor.name,
                professor_lab: ci.professor.lab,
                semester: ci.semester,
                year: ci.year,
                review_count: ci.review_count,
                average_rating: ci.average_rating.toString(),
            })),
            reviews_count: course.reviews.length,
        });
    } catch (error) {
        console.error("Get course error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

        const { id } = await params;
        const body = await request.json();
        const { code, name, credits, description, official_document_url } = body;

        // Get current course for audit log
        const currentCourse = await prisma.course.findUnique({
            where: { id },
        });

        if (!currentCourse) {
            return NextResponse.json(
                { detail: "Course not found" },
                { status: 404 }
            );
        }

        // Check for duplicate code if changing
        if (code && code !== currentCourse.code) {
            const existingCourse = await prisma.course.findUnique({
                where: { code },
            });
            if (existingCourse) {
                return NextResponse.json(
                    { detail: "A course with this code already exists" },
                    { status: 400 }
                );
            }
        }

        // Build update data
        const updateData: {
            code?: string;
            name?: string;
            credits?: number | null;
            description?: string | null;
            official_document_url?: string | null;
            updated_at: Date;
        } = {
            updated_at: new Date(),
        };

        if (code !== undefined) updateData.code = code;
        if (name !== undefined) updateData.name = name;
        if (credits !== undefined) updateData.credits = credits;
        if (description !== undefined) updateData.description = description;
        if (official_document_url !== undefined) updateData.official_document_url = official_document_url;

        const updatedCourse = await prisma.course.update({
            where: { id },
            data: updateData,
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "UPDATE",
            entityType: "COURSE",
            entityId: id,
            entityName: `${updatedCourse.code} - ${updatedCourse.name}`,
            details: {
                previous: {
                    code: currentCourse.code,
                    name: currentCourse.name,
                    credits: currentCourse.credits,
                    description: currentCourse.description,
                },
                updated: {
                    code: updatedCourse.code,
                    name: updatedCourse.name,
                    credits: updatedCourse.credits,
                    description: updatedCourse.description,
                },
            },
        });

        return NextResponse.json({
            id: updatedCourse.id,
            code: updatedCourse.code,
            name: updatedCourse.name,
            credits: updatedCourse.credits,
            description: updatedCourse.description,
            review_count: updatedCourse.review_count,
            average_rating: updatedCourse.average_rating.toString(),
            created_at: updatedCourse.created_at.toISOString(),
            updated_at: updatedCourse.updated_at.toISOString(),
        });
    } catch (error) {
        console.error("Update course error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

        const { id } = await params;

        // Get course details for audit log
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        course_instructors: true,
                        reviews: true,
                    },
                },
            },
        });

        if (!course) {
            return NextResponse.json(
                { detail: "Course not found" },
                { status: 404 }
            );
        }

        // Delete the course (cascades to course_instructors and reviews)
        await prisma.course.delete({
            where: { id },
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "DELETE",
            entityType: "COURSE",
            entityId: id,
            entityName: `${course.code} - ${course.name}`,
            details: {
                code: course.code,
                name: course.name,
                instructors_deleted: course._count.course_instructors,
                reviews_deleted: course._count.reviews,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete course error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
