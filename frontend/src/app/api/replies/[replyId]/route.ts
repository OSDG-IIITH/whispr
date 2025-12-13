/**
 * GET /api/replies/[replyId]/
 * Get a specific reply.
 * 
 * PUT /api/replies/[replyId]/
 * Update a reply.
 * 
 * DELETE /api/replies/[replyId]/
 * Delete a reply.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ replyId: string }> }
) {
    try {
        const { replyId } = await params

        const reply = await prisma.reply.findUnique({
            where: { id: replyId },
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
        })

        if (!reply) {
            return NextResponse.json(
                { detail: 'Reply not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(reply)
    } catch (error) {
        console.error('Get reply error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ replyId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { replyId } = await params
        const body = await request.json()

        const reply = await prisma.reply.findUnique({
            where: { id: replyId },
        })

        if (!reply) {
            return NextResponse.json(
                { detail: 'Reply not found' },
                { status: 404 }
            )
        }

        if (reply.user_id !== currentUser.id) {
            return NextResponse.json(
                { detail: 'Not authorized' },
                { status: 403 }
            )
        }

        const updatedReply = await prisma.reply.update({
            where: { id: replyId },
            data: {
                content: body.content ?? reply.content,
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
            },
        })

        return NextResponse.json(updatedReply)
    } catch (error) {
        console.error('Update reply error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ replyId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { replyId } = await params

        const reply = await prisma.reply.findUnique({
            where: { id: replyId },
        })

        if (!reply) {
            return NextResponse.json(
                { detail: 'Reply not found' },
                { status: 404 }
            )
        }

        if (reply.user_id !== currentUser.id && !currentUser.is_admin) {
            return NextResponse.json(
                { detail: 'Not authorized' },
                { status: 403 }
            )
        }

        await prisma.reply.delete({
            where: { id: replyId },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Delete reply error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
