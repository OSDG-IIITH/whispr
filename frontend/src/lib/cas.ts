/**
 * CAS (Central Authentication Service) client for IIITH verification
 * Handles anonymous verification flow
 */

const CAS_SERVER_URL = process.env.CAS_SERVER_URL || 'https://login.iiit.ac.in/cas'
const CAS_SERVICE_URL = process.env.CAS_SERVICE_URL!
const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'students.iiit.ac.in,research.iiit.ac.in,iiit.ac.in').split(',')

/**
 * Generate CAS login URL with session token as state parameter
 * The session token is passed as 'state' parameter to maintain
 * verification session during CAS flow.
 */
export function getCASLoginUrl(sessionToken: string): string {
    const serviceUrl = `${CAS_SERVICE_URL}?state=${encodeURIComponent(sessionToken)}`
    const params = new URLSearchParams({ service: serviceUrl })
    return `${CAS_SERVER_URL.replace(/\/$/, '')}/login?${params.toString()}`
}

/**
 * Validate CAS ticket and return email if successful
 * Returns email address if validation successful, null otherwise
 */
export async function validateCASTicket(
    ticket: string,
    sessionToken: string
): Promise<string | null> {
    const validationUrl = `${CAS_SERVER_URL.replace(/\/$/, '')}/serviceValidate`
    const serviceUrl = `${CAS_SERVICE_URL}?state=${encodeURIComponent(sessionToken)}`

    try {
        const response = await fetch(
            `${validationUrl}?ticket=${encodeURIComponent(ticket)}&service=${encodeURIComponent(serviceUrl)}`,
            { method: 'GET' }
        )

        if (!response.ok) {
            console.error('CAS validation HTTP error:', response.status)
            return null
        }

        const content = await response.text()

        // Parse CAS XML response
        if (content.includes('<cas:authenticationSuccess>')) {
            // Extract username (email) from response
            const startTag = '<cas:user>'
            const endTag = '</cas:user>'
            const startIndex = content.indexOf(startTag)
            const endIndex = content.indexOf(endTag)

            if (startIndex !== -1 && endIndex > startIndex) {
                const email = content.substring(startIndex + startTag.length, endIndex).trim()

                // Validate IIITH email format
                if (isValidIIITHEmail(email)) {
                    return email
                }
            }
        }

        return null
    } catch (error) {
        console.error('CAS validation error:', error)
        return null
    }
}

/**
 * Check if email is from a valid IIITH domain
 */
export function isValidIIITHEmail(email: string): boolean {
    const emailLower = email.toLowerCase()
    return ALLOWED_EMAIL_DOMAINS.some(domain =>
        emailLower.endsWith(`@${domain.trim()}`)
    )
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
 * Get verification session expiration time
 */
export function getSessionExpirationMinutes(): number {
    return parseInt(process.env.VERIFICATION_SESSION_EXPIRE_MINUTES || '30', 10)
}
