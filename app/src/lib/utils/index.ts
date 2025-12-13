/**
 * Utility functions barrel export
 *
 * This file re-exports utilities organized by domain.
 * Import from here for convenience, or import specific modules for smaller bundles.
 */

// Date utilities
export { formatRelativeTime, formatDate, formatDateTime } from "./date";

// String utilities
export { cn, truncateText, isValidEmail, isIIITHEmail } from "./string";

// Avatar utilities
export { getAvatarColor } from "./avatar";

// Rank utilities
export { getRank, getRankKey, getRankWithProgress } from "./rank";
