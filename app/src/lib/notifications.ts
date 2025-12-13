/**
 * Notification helper utilities
 * 
 * Functions for creating various types of notifications
 */

import prisma from '@/lib/db'

/**
 * Extract @mentions from text content
 * Returns array of unique usernames mentioned
 */
export function extractMentions(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g
    const matches = content.match(mentionRegex)

    if (!matches) return []

    // Remove @ prefix and deduplicate
    const usernames = matches.map(m => m.slice(1).toLowerCase())
    return Array.from(new Set(usernames))
}

/**
 * Create mention notifications for all mentioned users
 */
export async function createMentionNotifications(params: {
    content: string
    actorUsername: string
    sourceId: string
    sourceType: 'review' | 'reply'
}): Promise<void> {
    const { content, actorUsername, sourceId, sourceType } = params
    const mentionedUsernames = extractMentions(content)

    // Filter out self-mentions
    const validMentions = mentionedUsernames.filter(
        username => username.toLowerCase() !== actorUsername.toLowerCase()
    )

    if (validMentions.length === 0) return

    // Verify mentioned users exist
    const existingUsers = await prisma.user.findMany({
        where: {
            username: { in: validMentions, mode: 'insensitive' },
            is_banned: false,
        },
        select: { username: true },
    })

    const existingUsernames = existingUsers.map(u => u.username)

    // Create notifications for each mentioned user
    for (const username of existingUsernames) {
        await prisma.notification.create({
            data: {
                username,
                type: 'MENTION',
                content: `@${actorUsername} mentioned you in a ${sourceType}`,
                source_id: sourceId,
                source_type: sourceType,
                actor_username: actorUsername,
                is_read: false,
            },
        })
    }
}

/**
 * Create follower activity notifications
 * Notifies all followers of a user when they post new content
 */
export async function createFollowerActivityNotifications(params: {
    actorId: string
    actorUsername: string
    sourceId: string
    sourceType: 'review' | 'reply'
    contentPreview?: string
}): Promise<void> {
    const { actorId, actorUsername, sourceId, sourceType, contentPreview } = params

    // Get all followers of the actor
    const followers = await prisma.userFollower.findMany({
        where: { followed_id: actorId },
        include: {
            follower: {
                select: { username: true, is_banned: true },
            },
        },
    })

    // Filter out banned users
    const activeFollowers = followers.filter(f => !f.follower.is_banned)

    if (activeFollowers.length === 0) return

    const notificationType = sourceType === 'review' ? 'FOLLOWER_REVIEW' : 'FOLLOWER_REPLY'
    const truncatedPreview = contentPreview
        ? (contentPreview.length > 50 ? contentPreview.slice(0, 50) + '...' : contentPreview)
        : ''
    const content = truncatedPreview
        ? `@${actorUsername} posted a new ${sourceType}: "${truncatedPreview}"`
        : `@${actorUsername} posted a new ${sourceType}`

    // Create notifications for each follower
    for (const follower of activeFollowers) {
        await prisma.notification.create({
            data: {
                username: follower.follower.username,
                type: notificationType,
                content,
                source_id: sourceId,
                source_type: sourceType,
                actor_username: actorUsername,
                is_read: false,
            },
        })
    }
}
