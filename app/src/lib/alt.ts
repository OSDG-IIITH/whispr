/**
 * Alt Auth utilities for IIITH student verification
 *
 * Alt Auth is a universal authentication service that verifies IIITH students
 * using email + OTP without requiring API keys or pre-registration.
 */

/**
 * Get the Alt Auth base URL from environment
 */
export function getAltAuthUrl(): string {
  return process.env.ALT_AUTH_URL || "https://alt-osdg.vercel.app";
}

/**
 * Get the Alt Auth login URL
 */
export function getAltLoginUrl(): string {
  return `${getAltAuthUrl()}/login`;
}

/**
 * Generate a secure random nonce for the auth flow
 * This nonce is stored in a cookie and verified during callback
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Get verification session expiration time (in minutes)
 */
export function getSessionExpirationMinutes(): number {
  return parseInt(process.env.VERIFICATION_SESSION_EXPIRE_MINUTES || "30", 10);
}

/**
 * Check if email is from a valid IIITH domain
 */
export function isValidEmail(email: string): boolean {
  const allowedDomains = (
    process.env.ALLOWED_EMAIL_DOMAINS ||
    "students.iiit.ac.in,research.iiit.ac.in,iiit.ac.in"
  ).split(",");
  const emailLower = email.toLowerCase();
  return allowedDomains.some((domain) =>
    emailLower.endsWith(`@${domain.trim()}`)
  );
}

/**
 * Alt Auth profile returned from verify-claim endpoint
 */
export interface AltAuthProfile {
  id: string;
  email: string;
  username?: string;
  rollNumber?: string;
  batch?: string;
  branch?: string;
  profileCompleted: boolean;
}

/**
 * Response from Alt Auth verify-claim endpoint
 */
export interface AltAuthVerifyResponse {
  success: boolean;
  profile?: AltAuthProfile;
  sessionToken?: string;
  sessionCookieName?: string;
  sessionDurationMs?: number;
  error?: string;
}

/**
 * Verify claim token with Alt Auth server (server-to-server)
 *
 * This function calls Alt Auth's verify-claim endpoint to validate the
 * authentication and retrieve the user's email for verification.
 *
 * IMPORTANT: We only extract the email from the profile for anonymity.
 * The email is used solely to verify student status and prevent duplicate
 * verifications. NO mapping between email and Whispr username is stored.
 */
export async function verifyAltClaim(params: {
  requestId: string;
  claimToken: string;
  nonce: string;
  origin: string;
}): Promise<AltAuthVerifyResponse> {
  const altAuthUrl = getAltAuthUrl();

  try {
    const response = await fetch(`${altAuthUrl}/api/auth/verify-claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: params.requestId,
        claimToken: params.claimToken,
        nonce: params.nonce,
        origin: params.origin,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Verification failed",
      };
    }

    return {
      success: data.success,
      profile: data.profile,
      sessionToken: data.sessionToken,
      sessionCookieName: data.sessionCookieName,
      sessionDurationMs: data.sessionDurationMs,
    };
  } catch (error) {
    console.error("Alt Auth verify-claim error:", error);
    return {
      success: false,
      error: "Failed to communicate with Alt Auth server",
    };
  }
}
