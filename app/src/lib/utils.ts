import React from "react";
import { RANKS, type Rank, type RankKey } from "./constants";

/**
 * Get user rank based on echoes (upvotes received)
 */
export function getRank(echoes: number): Rank {
    if (echoes >= RANKS.LEGEND.min) return RANKS.LEGEND;
    if (echoes >= RANKS.EXPERT.min) return RANKS.EXPERT;
    if (echoes >= RANKS.REVIEWER.min) return RANKS.REVIEWER;
    if (echoes >= RANKS.CONTRIBUTOR.min) return RANKS.CONTRIBUTOR;
    return RANKS.NEWBIE;
}

/**
 * Get rank key based on echoes
 */
export function getRankKey(echoes: number): RankKey {
    if (echoes >= RANKS.LEGEND.min) return "LEGEND";
    if (echoes >= RANKS.EXPERT.min) return "EXPERT";
    if (echoes >= RANKS.REVIEWER.min) return "REVIEWER";
    if (echoes >= RANKS.CONTRIBUTOR.min) return "CONTRIBUTOR";
    return "NEWBIE";
}

/**
 * Utility function to combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return "just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths}mo ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
}

/**
 * Format date to readable format (e.g., "Jan 15, 2023")
 */
export function formatDate(date: Date | string): string {
    const target = new Date(date);
    return target.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format date and time to readable format (e.g., "Jan 15, 2023 at 2:30 PM")
 */
export function formatDateTime(date: Date | string): string {
    const target = new Date(date);
    const dateStr = target.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const timeStr = target.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    return `${dateStr} at ${timeStr}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if email is from IIITH domain
 */
export function isIIITHEmail(email: string): boolean {
    return email.endsWith("@iiit.ac.in") || email.endsWith("@students.iiit.ac.in");
}

/**
 * Parse content and highlight mentions (deprecated - use MentionText component instead)
 */
export function highlightMentions(content: string): React.ReactNode {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
        // Every odd index is a username (captured group)
        if (index % 2 === 1) {
            return React.createElement(
                'span',
                {
                    key: index,
                    className: "text-primary font-medium hover:underline cursor-pointer",
                    onClick: () => {
                        // Navigate to user profile
                        window.location.href = `/profile/${part}`;
                    }
                },
                `@${part}`
            );
        }
        return part;
    });
}

/**
 * Generate avatar color based on username
 */
export function getAvatarColor(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
}

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Get rank with additional information including max echoes for current rank
 */
export function getRankWithProgress(echoes: number): Rank & { max: number; nextRankName?: string; echoesToNext?: number } {
    const currentRank = getRank(echoes);

    // Define the rank progression order
    const rankOrder = [
        { key: "NEWBIE", rank: RANKS.NEWBIE },
        { key: "CONTRIBUTOR", rank: RANKS.CONTRIBUTOR },
        { key: "REVIEWER", rank: RANKS.REVIEWER },
        { key: "EXPERT", rank: RANKS.EXPERT },
        { key: "LEGEND", rank: RANKS.LEGEND }
    ];

    // Find current rank index
    const currentRankIndex = rankOrder.findIndex(r => r.rank === currentRank);

    // If this is the highest rank, max is Infinity
    if (currentRankIndex === rankOrder.length - 1) {
        return {
            ...currentRank,
            max: Infinity,
            nextRankName: undefined,
            echoesToNext: undefined
        };
    }

    // Get next rank information
    const nextRank = rankOrder[currentRankIndex + 1];
    const echoesToNext = nextRank.rank.min - echoes;

    return {
        ...currentRank,
        max: nextRank.rank.min,
        nextRankName: nextRank.rank.name,
        echoesToNext: Math.max(0, echoesToNext)
    };
}
