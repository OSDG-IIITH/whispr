/**
 * GET /api/search/
 * Unified search across courses, professors, users, and reviews.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

interface SearchResult {
    entity_type: string
    data: unknown
    relevance_score: number
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query') || ''
        const deep = searchParams.get('deep') === 'true'
        const entityTypes = searchParams.getAll('entity_types')
        const skip = parseInt(searchParams.get('skip') || '0', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

        if (!query || query.length < 2) {
            return NextResponse.json({
                results: [],
                total: 0,
            })
        }

        const results: SearchResult[] = []
        const allowedTypes = entityTypes.length > 0 ? entityTypes : ['course', 'professor', 'user', 'review']

        // Search courses
        if (allowedTypes.includes('course')) {
            const orClauses: { code?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }[] = [
                { code: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
            ]
            if (deep) {
                orClauses.push({ description: { contains: query, mode: 'insensitive' } })
            }

            const courses = await prisma.course.findMany({
                where: { OR: orClauses },
                take: limit,
                include: {
                    course_instructors: {
                        include: {
                            professor: true,
                        },
                    },
                },
            })

            courses.forEach(course => {
                const codeMatch = course.code.toLowerCase().includes(query.toLowerCase())
                const nameMatch = course.name.toLowerCase().includes(query.toLowerCase())
                results.push({
                    entity_type: 'course',
                    data: course,
                    relevance_score: codeMatch ? 1.0 : nameMatch ? 0.8 : 0.5,
                })
            })
        }

        // Search professors
        if (allowedTypes.includes('professor')) {
            const professors = await prisma.professor.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { lab: { contains: query, mode: 'insensitive' } },
                    ],
                },
                take: limit,
                include: {
                    social_media: true,
                    course_instructors: {
                        include: {
                            course: true,
                        },
                    },
                },
            })

            professors.forEach(professor => {
                const nameMatch = professor.name.toLowerCase().includes(query.toLowerCase())
                results.push({
                    entity_type: 'professor',
                    data: professor,
                    relevance_score: nameMatch ? 0.9 : 0.6,
                })
            })
        }

        // Search users
        if (allowedTypes.includes('user')) {
            const users = await prisma.user.findMany({
                where: {
                    username: { contains: query, mode: 'insensitive' },
                    is_banned: false,
                },
                take: limit,
                select: {
                    id: true,
                    username: true,
                    bio: true,
                    student_since_year: true,
                    is_muffled: true,
                    is_admin: true,
                    is_banned: true,
                    echoes: true,
                    created_at: true,
                    updated_at: true,
                },
            })

            users.forEach(user => {
                results.push({
                    entity_type: 'user',
                    data: user,
                    relevance_score: 0.7,
                })
            })
        }

        // Search reviews (if deep search)
        if (deep && allowedTypes.includes('review')) {
            const reviews = await prisma.review.findMany({
                where: {
                    content: { contains: query, mode: 'insensitive' },
                },
                take: limit,
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
                },
            })

            reviews.forEach(review => {
                results.push({
                    entity_type: 'review',
                    data: review,
                    relevance_score: 0.5,
                })
            })
        }

        // Sort by relevance and paginate
        results.sort((a, b) => b.relevance_score - a.relevance_score)
        const paginatedResults = results.slice(skip, skip + limit)

        return NextResponse.json({
            results: paginatedResults,
            total: results.length,
        })
    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
