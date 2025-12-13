/**
 * GET /api/verify/callback/
 * Alt Auth callback handler.
 *
 * This route handles the redirect from Alt Auth after user authentication.
 * It verifies the claim token server-to-server and unmutes the user.
 *
 * IMPORTANT: For anonymity, we ONLY store that an email was used, NOT which
 * user it belongs to. The email-to-user mapping is never stored.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";
import { verifyAltClaim, isValidEmail } from "@/lib/alt";

// Cookie name for Alt Auth state (matches what frontend sets)
const ALT_AUTH_STATE_COOKIE = "whispr_alt_auth_state";

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;

  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("request_id");
    const claim = searchParams.get("claim");

    // Validate required params from Alt Auth redirect
    if (!requestId || !claim) {
      return NextResponse.redirect(
        new URL("/verify?error=missing_params", baseUrl)
      );
    }

    // Read the state cookie set by the frontend
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get(ALT_AUTH_STATE_COOKIE);

    if (!stateCookie?.value) {
      return NextResponse.redirect(
        new URL("/verify?error=missing_state", baseUrl)
      );
    }

    // Parse the stored state
    let state: { nonce: string; userId: string };
    try {
      state = JSON.parse(stateCookie.value);
    } catch {
      return NextResponse.redirect(
        new URL("/verify?error=invalid_state", baseUrl)
      );
    }

    if (!state.nonce || !state.userId) {
      return NextResponse.redirect(
        new URL("/verify?error=invalid_state", baseUrl)
      );
    }

    // Find verification session by nonce
    const session = await prisma.verificationSession.findFirst({
      where: {
        session_token: state.nonce,
        user_id: state.userId,
      },
      include: { user: true },
    });

    if (!session) {
      return NextResponse.redirect(
        new URL("/verify?error=invalid_session", baseUrl)
      );
    }

    // Check if session is expired
    if (new Date() > session.expires_at) {
      await prisma.verificationSession.delete({
        where: { id: session.id },
      });
      return NextResponse.redirect(
        new URL("/verify?error=session_expired", baseUrl)
      );
    }

    // Verify claim with Alt Auth (server-to-server)
    const result = await verifyAltClaim({
      requestId,
      claimToken: claim,
      nonce: state.nonce,
      origin: baseUrl,
    });

    if (!result.success || !result.profile?.email) {
      console.error("Alt Auth verification failed:", result.error);
      return NextResponse.redirect(
        new URL(`/verify?error=${result.error || "alt_auth_failed"}`, baseUrl)
      );
    }

    const email = result.profile.email.toLowerCase();

    // Double-check email is from valid IIITH domain (defense in depth)
    // Alt Auth already validates this, but we check again for security
    if (!isValidEmail(email)) {
      await prisma.verificationSession.delete({
        where: { id: session.id },
      });
      return NextResponse.redirect(
        new URL("/verify?error=invalid_email_domain", baseUrl)
      );
    }

    // Check if email is already used by another account
    // IMPORTANT: We only store that the email was used, NOT which user
    const existingEmail = await prisma.usedEmail.findUnique({
      where: { email },
    });

    if (existingEmail && existingEmail.verified_at) {
      await prisma.verificationSession.delete({
        where: { id: session.id },
      });
      return NextResponse.redirect(
        new URL("/verify?error=email_already_used", baseUrl)
      );
    }

    // Mark email as used (for duplicate prevention only - NO user mapping)
    // This ensures anonymity: we know an email was used but not by whom
    await prisma.usedEmail.upsert({
      where: { email },
      update: { verified_at: new Date() },
      create: { email, verified_at: new Date() },
    });

    // Unmute the user (enable full platform access)
    await prisma.user.update({
      where: { id: session.user_id },
      data: {
        is_muffled: false,
        echoes: { increment: 50 }, // Bonus echoes for verification
        updated_at: new Date(),
      },
    });

    // Delete the verification session (no longer needed)
    await prisma.verificationSession.delete({
      where: { id: session.id },
    });

    // Clear the auth state cookie and redirect to success
    const response = NextResponse.redirect(
      new URL("/verify?success=true", baseUrl)
    );
    response.cookies.set(ALT_AUTH_STATE_COOKIE, "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verification callback error:", error);
    return NextResponse.redirect(
      new URL("/verify?error=internal_error", baseUrl)
    );
  }
}
