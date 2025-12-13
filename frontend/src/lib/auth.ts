/**
 * JWT Authentication utilities for Whispr
 * Handles token creation, verification, and user session management
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import prisma from './db'
import type { User } from '@prisma/client'

// Configuration from environment
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_ALGORITHM = 'HS256'
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION || '86400', 10) // 1 day default
const COOKIE_NAME = 'auth_token'

export interface TokenPayload {
    sub: string // user id
    exp: number
    iat: number
}

/**
 * Hash a password using bcrypt
 */
export function hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10)
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(password, hashedPassword)
}

/**
 * Create a JWT access token
 */
export function createAccessToken(userId: string, expiresInSeconds?: number): string {
    const exp = Math.floor(Date.now() / 1000) + (expiresInSeconds || JWT_EXPIRATION)

    const payload: TokenPayload = {
        sub: userId,
        exp,
        iat: Math.floor(Date.now() / 1000),
    }

    return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM })
}

/**
 * Verify a JWT token and return the payload
 */
export function verifyToken(token: string): TokenPayload | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as TokenPayload
        return payload
    } catch {
        return null
    }
}

/**
 * Get the token from request cookies
 */
export function getTokenFromCookies(request: NextRequest): string | null {
    return request.cookies.get(COOKIE_NAME)?.value || null
}

/**
 * Get the token from the cookies() async function (for server components/actions)
 */
export async function getTokenFromServerCookies(): Promise<string | null> {
    const cookieStore = await cookies()
    return cookieStore.get(COOKIE_NAME)?.value || null
}

/**
 * Get the current user from request
 * Returns null if not authenticated
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
    const token = getTokenFromCookies(request)
    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        })
        return user
    } catch {
        return null
    }
}

/**
 * Get the current user from server cookies (for server components)
 */
export async function getCurrentUserFromServerCookies(): Promise<User | null> {
    const token = await getTokenFromServerCookies()
    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        })
        return user
    } catch {
        return null
    }
}

/**
 * Check if user is muffled (can't post content)
 * Throws if user is muffled
 */
export function requireUnmuffledUser(user: User): void {
    if (user.is_muffled && !user.is_banned) {
        throw new Error('You are muffled. Please verify your email to post content.')
    }
}

/**
 * Check if user is admin
 * Throws if user is not admin
 */
export function requireAdminUser(user: User): void {
    if (!user.is_admin) {
        throw new Error('Admin access required')
    }
}

/**
 * Authenticate user with username and password
 * Returns user if successful, null otherwise
 */
export async function authenticateUser(username: string, password: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user) return null
        if (!verifyPassword(password, user.hashed_password)) return null

        return user
    } catch {
        return null
    }
}

/**
 * Set auth cookie on response
 */
export function setAuthCookie(token: string): string {
    const secure = process.env.NODE_ENV === 'production'
    const sameSite = process.env.COOKIE_SAMESITE || 'lax'
    const domain = process.env.COOKIE_DOMAIN || ''

    let cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${JWT_EXPIRATION}`
    if (secure) cookie += '; Secure'
    if (domain) cookie += `; Domain=${domain}`

    return cookie
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(): string {
    const domain = process.env.COOKIE_DOMAIN || ''
    let cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`
    if (domain) cookie += `; Domain=${domain}`
    return cookie
}

// Export cookie name for consistency
export { COOKIE_NAME }
