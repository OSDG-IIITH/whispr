/**
 * POST /api/verify/initiate/
 * Initiate Alt Auth verification flow.
 *
 * Returns a nonce that the client must store in a cookie before redirecting
 * to the Alt Auth login page. The nonce is used to verify the callback.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  generateNonce,
  getAltLoginUrl,
  getSessionExpirationMinutes,
} from "@/lib/alt";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { detail: "Could not validate credentials" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    // Check if user is already verified
    if (!currentUser.is_muffled) {
      return NextResponse.json(
        { detail: "You are already verified" },
        { status: 400 }
      );
    }

    // Generate nonce for Alt Auth flow
    const nonce = generateNonce();
    const expiresInMinutes = getSessionExpirationMinutes();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Delete any existing verification sessions for this user
    await prisma.verificationSession.deleteMany({
      where: { user_id: currentUser.id },
    });

    // Create new verification session with nonce
    // The session_token field stores the nonce for Alt Auth flow
    await prisma.verificationSession.create({
      data: {
        user_id: currentUser.id,
        session_token: nonce,
        expires_at: expiresAt,
      },
    });

    // Get Alt Auth login URL
    const altLoginUrl = getAltLoginUrl();

    return NextResponse.json({
      alt_url: altLoginUrl,
      nonce: nonce,
      expires_in_minutes: expiresInMinutes,
    });
  } catch (error) {
    console.error("Initiate verification error:", error);
    return NextResponse.json({ detail: "An error occurred" }, { status: 500 });
  }
}
