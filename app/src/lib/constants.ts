import { Shield, Users, MessageSquare, TrendingUp } from "lucide-react";

// Features for the landing page
export const FEATURES = [
    {
        title: "Anonymous Reviews",
        description: "Share honest opinions without revealing your identity. Your privacy is protected.",
        icon: Shield
    },
    {
        title: "Verified Students",
        description: "Only verified IIITH students can post reviews using institutional email verification.",
        icon: Users
    },
    {
        title: "Community Driven",
        description: "Vote on reviews, reply to discussions, and follow other users to build a helpful community.",
        icon: MessageSquare
    },
    {
        title: "Reputation System",
        description: "Build your reputation through helpful contributions and climb the ranks.",
        icon: TrendingUp
    }
];

// Rank system for users based on echoes (upvotes)
export const RANKS = {
    NEWBIE: {
        name: "Newbie",
        min: 0,
        icon: "🌱",
        color: "#9CA3AF",
        gradient: "from-gray-500 to-gray-600"
    },
    CONTRIBUTOR: {
        name: "Contributor",
        min: 10,
        icon: "🗣️",
        color: "#10B981",
        gradient: "from-green-500 to-green-600"
    },
    REVIEWER: {
        name: "Reviewer",
        min: 50,
        icon: "📝",
        color: "#14B8A6",
        gradient: "from-teal-500 to-green-500"
    },
    EXPERT: {
        name: "Expert",
        min: 150,
        icon: "🎯",
        color: "#059669",
        gradient: "from-emerald-500 to-teal-500"
    },
    LEGEND: {
        name: "Legend",
        min: 500,
        icon: "👑",
        color: "#F59E0B",
        gradient: "from-yellow-500 to-orange-500"
    }
} as const;

export type RankKey = keyof typeof RANKS;
export type Rank = typeof RANKS[RankKey];
