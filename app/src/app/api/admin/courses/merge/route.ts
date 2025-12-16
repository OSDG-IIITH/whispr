/**
 * POST /api/admin/courses/merge
 * Merge two courses (variant into canonical)
 * 
 * This transfers all course_instructors from the variant
 * course to the canonical course, then deletes the variant.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-logger";

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
        const { canonical_id, variant_id, preview } = body;

        if (!canonical_id || !variant_id) {
            return NextResponse.json(
                { detail: "Both canonical_id and variant_id are required" },
                { status: 400 }
            );
        }

        if (canonical_id === variant_id) {
            return NextResponse.json(
                { detail: "Cannot merge a course with itself" },
                { status: 400 }
            );
        }

        // Fetch both courses
        const [canonical, variant] = await Promise.all([
            prisma.course.findUnique({
                where: { id: canonical_id },
                include: {
                    _count: {
                        select: { course_instructors: true, reviews: true },
                    },
                },
            }),
            prisma.course.findUnique({
                where: { id: variant_id },
                include: {
                    _count: {
                        select: { course_instructors: true, reviews: true },
                    },
                },
            }),
        ]);

        if (!canonical) {
            return NextResponse.json(
                { detail: "Canonical course not found" },
                { status: 404 }
            );
        }

        if (!variant) {
            return NextResponse.json(
                { detail: "Variant course not found" },
                { status: 404 }
            );
        }

        // If preview mode, just return what would be merged
        if (preview) {
            return NextResponse.json({
                canonical: {
                    id: canonical.id,
                    code: canonical.code,
                    name: canonical.name,
                    review_count: canonical.review_count,
                    average_rating: canonical.average_rating.toString(),
                    instructors_count: canonical._count.course_instructors,
                },
                variant: {
                    id: variant.id,
                    code: variant.code,
                    name: variant.name,
                    review_count: variant.review_count,
                    average_rating: variant.average_rating.toString(),
                    instructors_count: variant._count.course_instructors,
                },
                instructors_to_transfer: variant._count.course_instructors,
                reviews_to_transfer: variant._count.reviews,
            });
        }

        // Perform the merge in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Update course_instructors to point to canonical course
            await tx.courseInstructor.updateMany({
                where: { course_id: variant_id },
                data: { course_id: canonical_id },
            });

            // 2. Update reviews to point to canonical course
            await tx.review.updateMany({
                where: { course_id: variant_id },
                data: { course_id: canonical_id },
            });

            // 3. Delete the variant course
            await tx.course.delete({
                where: { id: variant_id },
            });

            // 4. Recalculate review statistics for canonical course
            const reviewStats = await tx.review.aggregate({
                where: { course_id: canonical_id },
                _count: true,
                _avg: { rating: true },
            });

            await tx.course.update({
                where: { id: canonical_id },
                data: {
                    review_count: reviewStats._count,
                    average_rating: reviewStats._avg.rating || 0,
                    updated_at: new Date(),
                },
            });
        });

        // Log the merge action
        await logAdminAction({
            adminId: currentUser.id,
            adminName: currentUser.username,
            actionType: "MERGE",
            entityType: "COURSE",
            entityId: canonical_id,
            entityName: `${canonical.code} - ${canonical.name}`,
            details: {
                canonical: {
                    id: canonical.id,
                    code: canonical.code,
                    name: canonical.name,
                },
                variant: {
                    id: variant.id,
                    code: variant.code,
                    name: variant.name,
                },
                instructors_transferred: variant._count.course_instructors,
                reviews_transferred: variant._count.reviews,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Successfully merged "${variant.code}" into "${canonical.code}"`,
            canonical_id: canonical_id,
        });
    } catch (error) {
        console.error("Merge courses error:", error);
        return NextResponse.json(
            { detail: "An error occurred during merge" },
            { status: 500 }
        );
    }
}
