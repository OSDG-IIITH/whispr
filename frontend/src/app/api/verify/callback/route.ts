/**
 * GET /api/verify/callback/
 * CAS callback handler - validates ticket and unmuffles user.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { validateCASTicket } from '@/lib/cas'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const ticket = searchParams.get('ticket')
        const state = searchParams.get('state') // session_token

        if (!ticket || !state) {
            return NextResponse.redirect(new URL('/verify?error=missing_params', request.url))
        }

        // Find verification session
        const session = await prisma.verificationSession.findUnique({
            where: { session_token: state },
            include: { user: true },
        })

        if (!session) {
            return NextResponse.redirect(new URL('/verify?error=invalid_session', request.url))
        }

        // Check if session is expired
        if (new Date() > session.expires_at) {
            await prisma.verificationSession.delete({
                where: { id: session.id },
            })
            return NextResponse.redirect(new URL('/verify?error=session_expired', request.url))
        }

        // Validate CAS ticket
        const email = await validateCASTicket(ticket, state)

        if (!email) {
            return NextResponse.redirect(new URL('/verify?error=cas_validation_failed', request.url))
        }

        // Check if email is already used
        const existingEmail = await prisma.usedEmail.findUnique({
            where: { email },
        })

        if (existingEmail && existingEmail.verified_at) {
            await prisma.verificationSession.delete({
                where: { id: session.id },
            })
            return NextResponse.redirect(new URL('/verify?error=email_already_used', request.url))
        }

        // Mark email as used
        await prisma.usedEmail.upsert({
            where: { email },
            update: { verified_at: new Date() },
            create: { email, verified_at: new Date() },
        })

        // Unmute the user
        await prisma.user.update({
            where: { id: session.user_id },
            data: {
                is_muffled: false,
                echoes: { increment: 50 }, // Bonus echoes for verification
                updated_at: new Date(),
            },
        })

        // Delete the verification session
        await prisma.verificationSession.delete({
            where: { id: session.id },
        })

        // Redirect to success page
        return NextResponse.redirect(new URL('/verify?success=true', request.url))
    } catch (error) {
        console.error('CAS callback error:', error)
        return NextResponse.redirect(new URL('/verify?error=internal_error', request.url))
    }
}
