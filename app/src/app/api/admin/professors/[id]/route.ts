/**
 * GET/PUT/DELETE /api/admin/professors/[id]
 * Get, update, or delete a specific professor
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

        const professor = await prisma.professor.findUnique({
            where: { id },
            include: {
                course_instructors: {
                    include: {
                        course: {
                            select: { id: true, code: true, name: true },
                        },
                    },
                },
                reviews: {
                    select: { id: true },
                },
            },
        });

        if (!professor) {
            return NextResponse.json(
                { detail: "Professor not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: professor.id,
            name: professor.name,
            lab: professor.lab,
            review_summary: professor.review_summary,
            review_count: professor.review_count,
            average_rating: professor.average_rating.toString(),
            created_at: professor.created_at.toISOString(),
            updated_at: professor.updated_at.toISOString(),
            courses: professor.course_instructors.map((ci) => ({
                id: ci.id,
                course_id: ci.course.id,
                course_code: ci.course.code,
                course_name: ci.course.name,
                semester: ci.semester,
                year: ci.year,
                review_count: ci.review_count,
                average_rating: ci.average_rating.toString(),
            })),
            reviews_count: professor.reviews.length,
        });
    } catch (error) {
        console.error("Get professor error:", error);
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
        const { name, lab } = body;

        // Get current professor for audit log
        const currentProfessor = await prisma.professor.findUnique({
            where: { id },
        });

        if (!currentProfessor) {
            return NextResponse.json(
                { detail: "Professor not found" },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: { name?: string; lab?: string; updated_at: Date } = {
            updated_at: new Date(),
        };

        if (name !== undefined) {
            updateData.name = name;
        }

        if (lab !== undefined) {
            updateData.lab = lab;
        }

        const updatedProfessor = await prisma.professor.update({
            where: { id },
            data: updateData,
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "UPDATE",
            entityType: "PROFESSOR",
            entityId: id,
            entityName: updatedProfessor.name,
            details: {
                previous: {
                    name: currentProfessor.name,
                    lab: currentProfessor.lab,
                },
                updated: {
                    name: updatedProfessor.name,
                    lab: updatedProfessor.lab,
                },
            },
        });

        return NextResponse.json({
            id: updatedProfessor.id,
            name: updatedProfessor.name,
            lab: updatedProfessor.lab,
            review_count: updatedProfessor.review_count,
            average_rating: updatedProfessor.average_rating.toString(),
            created_at: updatedProfessor.created_at.toISOString(),
            updated_at: updatedProfessor.updated_at.toISOString(),
        });
    } catch (error) {
        console.error("Update professor error:", error);
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

        // Get professor details for audit log
        const professor = await prisma.professor.findUnique({
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

        if (!professor) {
            return NextResponse.json(
                { detail: "Professor not found" },
                { status: 404 }
            );
        }

        // Delete the professor (cascades to course_instructors and reviews)
        await prisma.professor.delete({
            where: { id },
        });

        // Log the action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "DELETE",
            entityType: "PROFESSOR",
            entityId: id,
            entityName: professor.name,
            details: {
                courses_deleted: professor._count.course_instructors,
                reviews_deleted: professor._count.reviews,
                lab: professor.lab,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete professor error:", error);
        return NextResponse.json(
            { detail: "An error occurred" },
            { status: 500 }
        );
    }
}
