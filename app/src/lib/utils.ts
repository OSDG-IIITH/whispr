/**
 * Utility functions
 *
 * NOTE: This file is maintained for backwards compatibility.
 * Prefer importing from @/lib/utils/[module] for better tree-shaking.
 *
 * New structure:
 * - @/lib/utils/date - formatRelativeTime, formatDate, formatDateTime
 * - @/lib/utils/string - cn, truncateText, isValidEmail, isIIITHEmail
 * - @/lib/utils/avatar - getAvatarColor
 * - @/lib/utils/rank - getRank, getRankKey, getRankWithProgress
 */

// Re-export everything from new modules
export * from "./utils/date";
export * from "./utils/string";
export * from "./utils/avatar";
export * from "./utils/rank";

// Legacy exports for backwards compatibility
import React from "react";

/**
 * Parse content and highlight mentions
 * @deprecated Use MentionText component instead
 */
export function highlightMentions(content: string): React.ReactNode {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
        // Every odd index is a username (captured group)
        if (index % 2 === 1) {
            return React.createElement(
                "span",
                {
                    key: index,
                    className: "text-primary font-medium hover:underline cursor-pointer",
                    onClick: () => {
                        // Navigate to user profile
                        window.location.href = `/profile/${part}`;
                    },
                },
                `@${part}`
            );
        }
        return part;
    });
}

/**
 * Debounce function to limit function calls
 * @deprecated Use useDebounce hook from @/hooks/useDebounce instead
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
