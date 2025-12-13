/**
 * GET /api/notifications/[notificationId]/
 * Get a specific notification.
 * 
 * PUT /api/notifications/[notificationId]/
 * Mark notification as read.
 * 
 * DELETE /api/notifications/[notificationId]/
 * Delete a notification.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ notificationId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { notificationId } = await params

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
        })

        if (!notification) {
            return NextResponse.json(
                { detail: 'Notification not found' },
                { status: 404 }
            )
        }

        // Only owner can view
        if (notification.username !== currentUser.username) {
            return NextResponse.json(
                { detail: 'Not authorized' },
                { status: 403 }
            )
        }

        return NextResponse.json(notification)
    } catch (error) {
        console.error('Get notification error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ notificationId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { notificationId } = await params
        const body = await request.json()

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
        })

        if (!notification) {
            return NextResponse.json(
                { detail: 'Notification not found' },
                { status: 404 }
            )
        }

        if (notification.username !== currentUser.username) {
            return NextResponse.json(
                { detail: 'Not authorized' },
                { status: 403 }
            )
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: {
                is_read: body.is_read ?? notification.is_read,
            },
        })

        return NextResponse.json(updatedNotification)
    } catch (error) {
        console.error('Update notification error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ notificationId: string }> }
) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        const { notificationId } = await params

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
        })

        if (!notification) {
            return NextResponse.json(
                { detail: 'Notification not found' },
                { status: 404 }
            )
        }

        if (notification.username !== currentUser.username) {
            return NextResponse.json(
                { detail: 'Not authorized' },
                { status: 403 }
            )
        }

        await prisma.notification.delete({
            where: { id: notificationId },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Delete notification error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
