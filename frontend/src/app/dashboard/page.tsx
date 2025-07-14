"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getRankWithProgress } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { UserAvatar } from "@/components/user/UserAvatar";
import { Feed } from "@/components/dashboard/Feed";
import { feedAPI } from "@/lib/api";
import Loader from "@/components/common/Loader";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [stats, setStats] = useState({
    review_count: 0,
    reply_count: 0,
    vote_count: 0,
    followers_count: 0,
    following_count: 0,
    echoes: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Check if user needs verification
      setShowVerificationBanner(user.is_muffled);

      // Fetch user stats
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const userStats = await feedAPI.getStats();
      setStats(userStats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-4">
            Please log in to view your dashboard
          </p>
          <a href="/auth/login" className="btn btn-primary">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const rank = getRankWithProgress(user.echoes);

  return (
    <div className="min-h-screen bg-black">
      {/* Verification Banner */}
      {showVerificationBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border-b border-yellow-600/50"
        >
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-semibold text-sm">Your account is muffled</p>
                <p className="text-xs text-secondary">
                  Verify your student status to post reviews and vote
                </p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = "/verify")}
              className="btn btn-primary px-4 py-2 text-sm mt-2 sm:mt-0"
            >
              Verify Now
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-8 space-y-6">
              {/* User Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-primary/20 rounded-xl p-6"
              >
                <div className="text-center mb-6">
                  <div className="mb-4 flex justify-center">
                    <UserAvatar
                      username={user.username}
                      echoes={user.echoes}
                      size="xl"
                    />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{user.username}</h2>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-sm text-secondary">Rank:</span>
                    <span className="text-sm font-semibold text-primary">
                      {rank.name}
                    </span>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary">
                      {user.echoes}
                    </div>
                    <div className="text-xs text-secondary">Echoes</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Member since</span>
                    <span>{new Date(user.created_at).getFullYear()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Status</span>
                    <span
                      className={
                        !user.is_muffled ? "text-green-400" : "text-yellow-400"
                      }
                    >
                      {!user.is_muffled ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-primary/20 rounded-xl p-6"
              >
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/courses")}
                    className="w-full h-10 btn btn-primary text-sm"
                  >
                    Browse Courses
                  </button>
                  <button
                    onClick={() => router.push("/professors")}
                    className="w-full h-10 btn btn-primary text-sm"
                  >
                    Browse Professors
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${user?.username}`)}
                    className="w-full h-10 btn btn-secondary text-sm"
                  >
                    View Profile
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-primary/20 rounded-xl p-6"
            >
              <h1 className="text-xl sm:text-2xl font-bold mb-4">
                Welcome back, {user.username}!
              </h1>
              <p className="text-secondary mb-6 text-sm sm:text-base">
                Ready to share your thoughts on courses and professors? Your
                voice matters in helping others make informed decisions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats.review_count}
                  </div>
                  <div className="text-sm text-secondary">Reviews</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats.reply_count}
                  </div>
                  <div className="text-sm text-secondary">Replies</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats.vote_count}
                  </div>
                  <div className="text-sm text-secondary">Votes</div>
                </div>
              </div>

              {/* Social Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats.followers_count}
                  </div>
                  <div className="text-sm text-secondary">Followers</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : stats.following_count}
                  </div>
                  <div className="text-sm text-secondary">Following</div>
                </div>
              </div>
            </motion.div>

            {/* Feed Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-primary/20 rounded-xl p-6"
            >
              <Feed />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
