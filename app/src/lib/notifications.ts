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

    if (existingUsers.length === 0) return

    // Batch create notifications for all mentioned users
    await prisma.notification.createMany({
        data: existingUsers.map(u => ({
            username: u.username,
            type: 'MENTION',
            content: `@${actorUsername} mentioned you in a ${sourceType}`,
            source_id: sourceId,
            source_type: sourceType,
            actor_username: actorUsername,
            is_read: false,
        })),
        skipDuplicates: true,
    })
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

    // Get all followers of the actor (only select what we need)
    const followers = await prisma.userFollower.findMany({
        where: { followed_id: actorId },
        select: {
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
    const notificationContent = truncatedPreview
        ? `@${actorUsername} posted a new ${sourceType}: "${truncatedPreview}"`
        : `@${actorUsername} posted a new ${sourceType}`

    // Batch create notifications for all followers
    await prisma.notification.createMany({
        data: activeFollowers.map(f => ({
            username: f.follower.username,
            type: notificationType,
            content: notificationContent,
            source_id: sourceId,
            source_type: sourceType,
            actor_username: actorUsername,
            is_read: false,
        })),
        skipDuplicates: true,
    })
}
