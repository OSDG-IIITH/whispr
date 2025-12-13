/**
 * POST /api/verify/initiate/
 * Initiate CAS verification flow.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getCASLoginUrl, generateSessionToken, getSessionExpirationMinutes } from '@/lib/cas'

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { detail: 'Could not validate credentials' },
                { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
            )
        }

        // Check if user is already verified
        if (!currentUser.is_muffled) {
            return NextResponse.json(
                { detail: 'You are already verified' },
                { status: 400 }
            )
        }

        // Generate session token
        const sessionToken = generateSessionToken()
        const expiresInMinutes = getSessionExpirationMinutes()
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

        // Delete any existing verification sessions for this user
        await prisma.verificationSession.deleteMany({
            where: { user_id: currentUser.id },
        })

        // Create new verification session
        await prisma.verificationSession.create({
            data: {
                user_id: currentUser.id,
                session_token: sessionToken,
                expires_at: expiresAt,
            },
        })

        // Generate CAS login URL
        const casUrl = getCASLoginUrl(sessionToken)

        return NextResponse.json({
            cas_url: casUrl,
            session_token: sessionToken,
            expires_in_minutes: expiresInMinutes,
        })
    } catch (error) {
        console.error('Initiate verification error:', error)
        return NextResponse.json(
            { detail: 'An error occurred' },
            { status: 500 }
        )
    }
}
