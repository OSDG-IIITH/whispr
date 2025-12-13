/**
 * GET /api/reviews/
 * Retrieve reviews with optional filters.
 * 
 * POST /api/reviews/
 * Create a new review (requires unmuffled user).
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser, requireUnmuffledUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

type SortBy = 'date_new' | 'date_old' | 'votes_high' | 'votes_low' | 'rating_high' | 'rating_low' | 'controversial'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100)
        const courseId = searchParams.get('course_id')
        const professorId = searchParams.get('professor_id')
        const courseInstructorId = searchParams.get('course_instructor_id')
        const userId = searchParams.get('user_id')
        const sortBy = (searchParams.get('sort_by') || 'date_new') as SortBy

        // Build where clause
        const where: Prisma.ReviewWhereInput = {}
        if (courseId) where.course_id = courseId
        if (professorId) where.professor_id = professorId
        if (userId) where.user_id = userId
        if (courseInstructorId) {
            where.course_instructor_reviews = {
                some: { course_instructor_id: courseInstructorId },
            }
        }

        // Build order by clause
        let orderBy: Prisma.ReviewOrderByWithRelationInput
        switch (sortBy) {
            case 'date_old':
                orderBy = { created_at: 'asc' }
                break
            case 'votes_high':
                orderBy = { upvotes: 'desc' }
                break
            case 'votes_low':
                orderBy = { upvotes: 'asc' }
                break
            case 'rating_high':
                orderBy = { rating: 'desc' }
                break
            case 'rating_low':
                orderBy = { rating: 'asc' }
                break
            case 'controversial':
                // For controversial, we want high engagement (upvotes + downvotes) with mixed votes
                orderBy = { downvotes: 'desc' }
                break
            case 'date_new':
            default:
                orderBy = { created_at: 'desc' }
        }

        const reviews = await prisma.review.findMany({
            where,
            skip,
            take: limit,
            orderBy,
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

        // Transform to match expected format
        const formattedReviews = reviews.map(review => ({
            ...review,
            course_instructors: review.course_instructor_reviews.map(cir => ({
                id: cir.course_instructor.id,
                course: cir.course_instructor.course,
                professor: cir.course_instructor.professor,
            })),
        }))

        return NextResponse.json(formattedReviews)
    } catch (error) {
        console.error('Get reviews error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        try {
            requireUnmuffledUser(currentUser)
        } catch (e) {
            return NextResponse.json(
                { detail: (e as Error).message },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { course_id, professor_id, course_instructor_ids, rating, content } = body

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { detail: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Must have at least course_id or professor_id
        if (!course_id && !professor_id) {
            return NextResponse.json(
                { detail: 'Either course_id or professor_id is required' },
                { status: 400 }
            )
        }

        // Create the review
        const review = await prisma.review.create({
            data: {
                user_id: currentUser.id,
                course_id: course_id || null,
                professor_id: professor_id || null,
                rating,
                content: content || null,
                course_instructor_reviews: course_instructor_ids ? {
                    create: course_instructor_ids.map((ciId: string) => ({
                        course_instructor_id: ciId,
                    })),
                } : undefined,
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

        // Update stats for course/professor/course_instructors
        if (course_id) {
            await updateCourseStats(course_id)
        }
        if (professor_id) {
            await updateProfessorStats(professor_id)
        }
        if (course_instructor_ids) {
            for (const ciId of course_instructor_ids) {
                await updateCourseInstructorStats(ciId)
            }
        }

        // Award echo points to the user
        await prisma.user.update({
            where: { id: currentUser.id },
            data: { echoes: { increment: 10 } },
        })

        const formattedReview = {
            ...review,
            course_instructors: review.course_instructor_reviews.map(cir => ({
                id: cir.course_instructor.id,
                course: cir.course_instructor.course,
                professor: cir.course_instructor.professor,
            })),
        }

        return NextResponse.json(formattedReview, { status: 201 })
    } catch (error) {
        console.error('Create review error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

// Helper functions to update stats
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
