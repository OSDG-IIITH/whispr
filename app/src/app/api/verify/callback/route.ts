/**
 * GET /api/verify/callback/
 * Verification callback handler.
 * 
 * NOTE: This is a stub implementation that auto-approves verification.
 * In production, this should validate against the actual verification provider.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { validateVerification } from '@/lib/cas'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const state = searchParams.get('state') // session_token
        const isStub = searchParams.get('stub') === 'true'

        if (!state) {
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

        // Validate verification (stub implementation)
        const result = await validateVerification(state)

        if (!result.success || !result.email) {
            return NextResponse.redirect(new URL(`/verify?error=${result.error || 'validation_failed'}`, request.url))
        }

        // Check if email is already used (for future when real email verification is implemented)
        const existingEmail = await prisma.usedEmail.findUnique({
            where: { email: result.email },
        })

        // For stub implementation, skip the email uniqueness check
        // In production, you would want to enforce this
        if (!isStub && existingEmail && existingEmail.verified_at) {
            await prisma.verificationSession.delete({
                where: { id: session.id },
            })
            return NextResponse.redirect(new URL('/verify?error=email_already_used', request.url))
        }

        // Mark email as used (for real verification, use actual email)
        if (!isStub) {
            await prisma.usedEmail.upsert({
                where: { email: result.email },
                update: { verified_at: new Date() },
                create: { email: result.email, verified_at: new Date() },
            })
        }

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
        console.error('Verification callback error:', error)
        return NextResponse.redirect(new URL('/verify?error=internal_error', request.url))
    }
}
