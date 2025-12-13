/**
 * POST /api/admin/professors/merge
 * Merge two professors (variant into canonical)
 * 
 * This transfers all course_instructors and reviews from the variant
 * professor to the canonical professor, then deletes the variant.
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
                { detail: "Cannot merge a professor with itself" },
                { status: 400 }
            );
        }

        // Fetch both professors
        const [canonical, variant] = await Promise.all([
            prisma.professor.findUnique({
                where: { id: canonical_id },
                include: {
                    _count: {
                        select: { course_instructors: true, reviews: true },
                    },
                },
            }),
            prisma.professor.findUnique({
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
                { detail: "Canonical professor not found" },
                { status: 404 }
            );
        }

        if (!variant) {
            return NextResponse.json(
                { detail: "Variant professor not found" },
                { status: 404 }
            );
        }

        // If preview mode, just return what would be merged
        if (preview) {
            return NextResponse.json({
                canonical: {
                    id: canonical.id,
                    name: canonical.name,
                    lab: canonical.lab,
                    review_count: canonical.review_count,
                    average_rating: canonical.average_rating.toString(),
                    courses_count: canonical._count.course_instructors,
                },
                variant: {
                    id: variant.id,
                    name: variant.name,
                    lab: variant.lab,
                    review_count: variant.review_count,
                    average_rating: variant.average_rating.toString(),
                    courses_count: variant._count.course_instructors,
                },
                courses_to_transfer: variant._count.course_instructors,
                reviews_to_transfer: variant._count.reviews,
            });
        }

        // Perform the merge in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Update course_instructors to point to canonical professor
            await tx.courseInstructor.updateMany({
                where: { professor_id: variant_id },
                data: { professor_id: canonical_id },
            });

            // 2. Update reviews to point to canonical professor
            await tx.review.updateMany({
                where: { professor_id: variant_id },
                data: { professor_id: canonical_id },
            });

            // 3. Transfer social media links
            await tx.professorSocialMedia.updateMany({
                where: { professor_id: variant_id },
                data: { professor_id: canonical_id },
            });

            // 4. Delete the variant professor
            await tx.professor.delete({
                where: { id: variant_id },
            });

            // 5. Recalculate review statistics for canonical professor
            const reviewStats = await tx.review.aggregate({
                where: { professor_id: canonical_id },
                _count: true,
                _avg: { rating: true },
            });

            await tx.professor.update({
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
            entityType: "PROFESSOR",
            entityId: canonical_id,
            entityName: canonical.name,
            details: {
                canonical: {
                    id: canonical.id,
                    name: canonical.name,
                },
                variant: {
                    id: variant.id,
                    name: variant.name,
                },
                courses_transferred: variant._count.course_instructors,
                reviews_transferred: variant._count.reviews,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Successfully merged "${variant.name}" into "${canonical.name}"`,
            canonical_id: canonical_id,
        });
    } catch (error) {
        console.error("Merge professors error:", error);
        return NextResponse.json(
            { detail: "An error occurred during merge" },
            { status: 500 }
        );
    }
}
