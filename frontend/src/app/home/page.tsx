"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Star, MessageSquare, Users, Plus } from "lucide-react";
import { ReviewList } from "@/components/reviews/ReviewList";
import { EchoesDisplay } from "@/components/user/EchoesDisplay";
import { RankBadge } from "@/components/user/RankBadge";
import { UserAvatar } from "@/components/user/UserAvatar";

// Mock data
const mockUser = {
  username: "anonymous_whisperer",
  echoes: 150,
  rank: "trusted_whisperer",
  reviewCount: 12,
  followingCount: 8,
  viewCount: 234,
  avatarUrl: undefined
};

const mockReviews = [
  {
    id: "1",
    author: {
      username: "silent_student",
      echoes: 89,
      isVerified: true,
      avatarUrl: undefined
    },
    content: "Honestly one of the best courses I've taken at IIITH. Prof explains concepts really well and the assignments are challenging but fair. Highly recommend if you're interested in networking fundamentals.",
    rating: 5,
    upvotes: 24,
    downvotes: 2,
    replyCount: 5,
    createdAt: "2024-01-20T10:30:00Z",
    isEdited: false,
    userVote: null
  },
  {
    id: "2",
    author: {
      username: "code_monk",
      echoes: 267,
      isVerified: true,
      avatarUrl: undefined
    },
    content: "The course content is good but the pace is quite fast. Make sure you have solid programming basics before taking this. The projects are interesting though.",
    rating: 4,
    upvotes: 18,
    downvotes: 1,
    replyCount: 3,
    createdAt: "2024-01-19T15:45:00Z",
    isEdited: false,
    userVote: "up" as const
  }
];

const mockStats = [
  {
    label: "Total Reviews",
    value: "12",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    change: "+2"
  },
  {
    label: "Helpful Votes",
    value: "89",
    icon: <TrendingUp className="w-5 h-5 text-green-500" />,
    change: "+12"
  },
  {
    label: "Profile Views",
    value: "234",
    icon: <Users className="w-5 h-5 text-blue-500" />,
    change: "+5"
  }
];

export default function HomePage() {
  const [reviews, setReviews] = useState(mockReviews);
  const [loading, setLoading] = useState(false);

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    // TODO: Implement voting logic
    console.log(`Voting ${type} on review ${reviewId}`);
  };

  const handleReply = (reviewId: string) => {
    // TODO: Implement reply functionality
    console.log(`Replying to review ${reviewId}`);
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* User Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-primary/20 rounded-xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <UserAvatar
                    username={mockUser.username}
                    echoes={mockUser.echoes}
                    size="lg"
                    avatarUrl={mockUser.avatarUrl}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{mockUser.username}</h3>
                    <RankBadge echoes={mockUser.echoes} size="sm" />
                  </div>
                </div>

                <div className="mb-4">
                  <EchoesDisplay echoes={mockUser.echoes} recentChange={+5} />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="font-semibold text-primary">{mockUser.reviewCount}</div>
                    <div className="text-xs text-secondary">Reviews</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary">{mockUser.followingCount}</div>
                    <div className="text-xs text-secondary">Following</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary">{mockUser.viewCount}</div>
                    <div className="text-xs text-secondary">Views</div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                {mockStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                  >
                    {stat.icon}
                    <div className="flex-1">
                      <div className="font-semibold">{stat.value}</div>
                      <div className="text-xs text-secondary">{stat.label}</div>
                    </div>
                    <div className="text-xs text-green-400">
                      {stat.change}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <button className="w-full bg-primary text-black font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Write Review
                </button>
                <button className="w-full bg-card border border-border text-foreground py-3 rounded-xl hover:bg-muted/50 transition-colors">
                  Browse Courses
                </button>
              </motion.div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-3xl font-bold mb-2">Your Feed</h1>
              <p className="text-secondary">
                Latest reviews from students you follow and recommended content
              </p>
            </motion.div>

            {/* Feed Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 mb-6"
            >
              {["All", "Following", "Courses", "Professors"].map((filter, index) => (
                <button
                  key={filter}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${index === 0
                    ? 'bg-primary text-black'
                    : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </motion.div>

            {/* Reviews Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ReviewList
                reviews={reviews}
                loading={loading}
                onVote={handleVote}
                onReply={handleReply}
                emptyMessage="Your feed is empty. Follow some users or explore courses to see reviews here!"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}