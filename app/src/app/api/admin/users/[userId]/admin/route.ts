/**
 * POST /api/admin/users/[userId]/admin - Make user admin
 * DELETE /api/admin/users/[userId]/admin - Remove admin privileges
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser, requireAdminUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        try {
            requireAdminUser(currentUser)
        } catch {
            return NextResponse.json(
                { detail: 'Admin access required' },
                { status: 403 }
            )
        }

        // Find target user
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!targetUser) {
            return NextResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            )
        }

        if (targetUser.is_admin) {
            return NextResponse.json(
                { detail: 'User is already an admin' },
                { status: 400 }
            )
        }

        // Make user admin
        await prisma.user.update({
            where: { id: userId },
            data: {
                is_admin: true,
                updated_at: new Date(),
            },
        })

        return NextResponse.json({
            message: `Admin privileges granted to ${targetUser.username}`,
        })
    } catch (error) {
        console.error('Make admin error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        try {
            requireAdminUser(currentUser)
        } catch {
            return NextResponse.json(
                { detail: 'Admin access required' },
                { status: 403 }
            )
        }

        // Can't remove your own admin status
        if (userId === currentUser.id) {
            return NextResponse.json(
                { detail: 'Cannot remove your own admin privileges' },
                { status: 400 }
            )
        }

        // Find target user
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!targetUser) {
            return NextResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            )
        }

        if (!targetUser.is_admin) {
            return NextResponse.json(
                { detail: 'User is not an admin' },
                { status: 400 }
            )
        }

        // Remove admin privileges
        await prisma.user.update({
            where: { id: userId },
            data: {
                is_admin: false,
                updated_at: new Date(),
            },
        })

        return NextResponse.json({
            message: `Admin privileges removed from ${targetUser.username}`,
        })
    } catch (error) {
        console.error('Remove admin error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
