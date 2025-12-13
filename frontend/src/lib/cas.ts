/**
 * Verification stub utilities
 * TODO: Replace with actual verification method (email verification, OAuth, etc.)
 * 
 * Current implementation is a placeholder that validates any IIITH email format.
 */

/**
 * Stub: Generate a verification URL
 * In production, this should redirect to the actual verification provider
 */
export function getVerificationUrl(sessionToken: string): string {
    // Stub: Returns a local verification endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/api/verify/callback?state=${encodeURIComponent(sessionToken)}&stub=true`
}

/**
 * Stub: Validate verification (always succeeds for testing)
 * In production, this should validate against the actual verification provider
 */
export async function validateVerification(
    sessionToken: string
): Promise<{ success: boolean; email?: string; error?: string }> {
    // Stub: For development/testing, auto-approve verification
    // In production, this would validate against email verification service, OAuth, etc.

    if (!sessionToken) {
        return { success: false, error: 'Missing session token' }
    }

    // Stub: Generate a fake IIITH email for testing
    const stubEmail = `verified_user@students.iiit.ac.in`

    return { success: true, email: stubEmail }
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get verification session expiration time (in minutes)
 */
export function getSessionExpirationMinutes(): number {
    return parseInt(process.env.VERIFICATION_SESSION_EXPIRE_MINUTES || '30', 10)
}

/**
 * Check if email is from a valid domain (for future use)
 */
export function isValidEmail(email: string): boolean {
    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || 'students.iiit.ac.in,research.iiit.ac.in,iiit.ac.in').split(',')
    const emailLower = email.toLowerCase()
    return allowedDomains.some(domain =>
        emailLower.endsWith(`@${domain.trim()}`)
    )
}
