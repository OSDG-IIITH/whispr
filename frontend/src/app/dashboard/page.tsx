"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Star, MessageSquare, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { getRankWithProgress } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if user needs verification
      setShowVerificationBanner(user.is_muffled);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-4">Please log in to view your dashboard</p>
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
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
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
              onClick={() => window.location.href = '/verify'}
              className="btn btn-primary px-4 py-2 text-sm"
            >
              Verify Now
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
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
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-2xl font-bold mb-4 mx-auto">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-xl font-bold mb-2">{user.username}</h2>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-sm text-secondary">Rank:</span>
                    <span className="text-sm font-semibold text-primary">{rank.rank}</span>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary">{user.echoes}</div>
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
                    <span className={!user.is_muffled ? "text-green-400" : "text-yellow-400"}>
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
                    onClick={() => router.push('/courses')}
                    className="w-full h-10 btn btn-primary text-sm"
                  >
                    Write Review
                  </button>
                  <button
                    onClick={() => router.push('/courses')}
                    className="w-full h-10 btn btn-secondary text-sm"
                  >
                    Browse Courses
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
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-primary/20 rounded-xl p-6"
            >
              <h1 className="text-2xl font-bold mb-4">Welcome back, {user.username}!</h1>
              <p className="text-secondary mb-6">
                Ready to share your thoughts on courses and professors? Your voice matters in helping others make informed decisions.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-secondary">Reviews</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-secondary">Replies</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-secondary">Votes</div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-primary/20 rounded-xl p-6"
            >
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="text-center py-8">
                <div className="text-secondary mb-2">No recent activity</div>
                <p className="text-sm text-secondary">
                  Start by writing your first review or exploring courses
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}