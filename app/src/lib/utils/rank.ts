/**
 * User rank utilities
 */
import { RANKS, type Rank, type RankKey } from "../constants";

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
 * Get rank with additional information including max echoes for current rank
 */
export function getRankWithProgress(
    echoes: number
): Rank & { max: number; nextRankName?: string; echoesToNext?: number } {
    const currentRank = getRank(echoes);

    // Define the rank progression order
    const rankOrder = [
        { key: "NEWBIE", rank: RANKS.NEWBIE },
        { key: "CONTRIBUTOR", rank: RANKS.CONTRIBUTOR },
        { key: "REVIEWER", rank: RANKS.REVIEWER },
        { key: "EXPERT", rank: RANKS.EXPERT },
        { key: "LEGEND", rank: RANKS.LEGEND },
    ];

    // Find current rank index
    const currentRankIndex = rankOrder.findIndex((r) => r.rank === currentRank);

    // If this is the highest rank, max is Infinity
    if (currentRankIndex === rankOrder.length - 1) {
        return {
            ...currentRank,
            max: Infinity,
            nextRankName: undefined,
            echoesToNext: undefined,
        };
    }

    // Get next rank information
    const nextRank = rankOrder[currentRankIndex + 1];
    const echoesToNext = nextRank.rank.min - echoes;

    return {
        ...currentRank,
        max: nextRank.rank.min,
        nextRankName: nextRank.rank.name,
        echoesToNext: Math.max(0, echoesToNext),
    };
}
