/**
 * GET /api/reviews/[reviewId]/
 * Get a specific review by ID.
 * 
 * PUT /api/reviews/[reviewId]/
 * Update a review (owner only).
 * 
 * DELETE /api/reviews/[reviewId]/
 * Delete a review (owner or admin only).
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    try {
        const { reviewId } = await params

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        is_muffled: true,
                        is_admin: true,
                        is_banned: true,
                        echoes: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                professor: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                course_instructor_reviews: {
                    include: {
                        course_instructor: {
                            include: {
                                course: {
                                    select: {
                                        id: true,
                                        code: true,
                                        name: true,
                                    },
                                },
                                professor: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                replies: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                is_muffled: true,
                                is_admin: true,
                                is_banned: true,
                                echoes: true,
                            },
                        },
                    },
                },
            },
        })

        if (!review) {
            return NextResponse.json(
                { detail: 'Review not found' },
                { status: 404 }
            )
        }

        const formattedReview = {
            ...review,
            course_instructors: review.course_instructor_reviews.map(cir => ({
                id: cir.course_instructor.id,
                course: cir.course_instructor.course,
                professor: cir.course_instructor.professor,
            })),
        }

        return NextResponse.json(formattedReview)
    } catch (error) {
        console.error('Get review error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { reviewId } = await params
        const body = await request.json()

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        })

        if (!review) {
            return NextResponse.json(
                { detail: 'Review not found' },
                { status: 404 }
            )
        }

        // Only owner can update
        if (review.user_id !== currentUser.id) {
            return NextResponse.json(
                { detail: 'Not authorized to update this review' },
                { status: 403 }
            )
        }

        // Validate rating if provided
        if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
            return NextResponse.json(
                { detail: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating: body.rating ?? review.rating,
                content: body.content !== undefined ? body.content : review.content,
                is_edited: true,
                updated_at: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        is_muffled: true,
                        is_admin: true,
                        is_banned: true,
                        echoes: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                professor: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                course_instructor_reviews: {
                    include: {
                        course_instructor: {
                            include: {
                                course: {
                                    select: {
                                        id: true,
                                        code: true,
                                        name: true,
                                    },
                                },
                                professor: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        // Update stats if rating changed
        if (body.rating !== undefined && body.rating !== review.rating) {
            if (updatedReview.course_id) {
                await updateCourseStats(updatedReview.course_id)
            }
            if (updatedReview.professor_id) {
                await updateProfessorStats(updatedReview.professor_id)
            }
        }

        const formattedReview = {
            ...updatedReview,
            course_instructors: updatedReview.course_instructor_reviews.map(cir => ({
                id: cir.course_instructor.id,
                course: cir.course_instructor.course,
                professor: cir.course_instructor.professor,
            })),
        }

        return NextResponse.json(formattedReview)
    } catch (error) {
        console.error('Update review error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { reviewId } = await params

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                course_instructor_reviews: true,
            },
        })

        if (!review) {
            return NextResponse.json(
                { detail: 'Review not found' },
                { status: 404 }
            )
        }

        // Owner or admin can delete
        if (review.user_id !== currentUser.id && !currentUser.is_admin) {
            return NextResponse.json(
                { detail: 'Not authorized to delete this review' },
                { status: 403 }
            )
        }

        // Store IDs for stat updates
        const courseId = review.course_id
        const professorId = review.professor_id
        const courseInstructorIds = review.course_instructor_reviews.map(cir => cir.course_instructor_id)

        // Delete the review
        await prisma.review.delete({
            where: { id: reviewId },
        })

        // Update stats
        if (courseId) {
            await updateCourseStats(courseId)
        }
        if (professorId) {
            await updateProfessorStats(professorId)
        }
        for (const ciId of courseInstructorIds) {
            await updateCourseInstructorStats(ciId)
        }

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Delete review error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

// Helper functions
async function updateCourseStats(courseId: string) {
    const stats = await prisma.review.aggregate({
        where: { course_id: courseId },
        _avg: { rating: true },
        _count: true,
    })

    await prisma.course.update({
        where: { id: courseId },
        data: {
            average_rating: stats._avg.rating || 0,
            review_count: stats._count,
            updated_at: new Date(),
        },
    })
}

async function updateProfessorStats(professorId: string) {
    const stats = await prisma.review.aggregate({
        where: { professor_id: professorId },
        _avg: { rating: true },
        _count: true,
    })

    await prisma.professor.update({
        where: { id: professorId },
        data: {
            average_rating: stats._avg.rating || 0,
            review_count: stats._count,
            updated_at: new Date(),
        },
    })
}

async function updateCourseInstructorStats(courseInstructorId: string) {
    const reviews = await prisma.courseInstructorReview.findMany({
        where: { course_instructor_id: courseInstructorId },
        include: { review: true },
    })

    const ratings = reviews.map(r => r.review.rating)
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

    await prisma.courseInstructor.update({
        where: { id: courseInstructorId },
        data: {
            average_rating: avgRating,
            review_count: ratings.length,
        },
    })
}
