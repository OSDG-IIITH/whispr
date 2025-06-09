"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Star, MessageSquare, TrendingUp } from "lucide-react";
import { getRankWithProgress } from "@/lib/utils";

// Mock user data - in real app this would come from API
const mockUser = {
  id: "1",
  username: "anonymous_whisperer",
  avatar_url: null,
  bio: "Just sharing my honest thoughts",
  student_since_year: 2022,
  is_muffled: false,
  is_verified: true,
  is_admin: false,
  echoes: 150,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T10:00:00Z"
};

export default function DashboardPage() {
  const [user, setUser] = useState(mockUser);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  useEffect(() => {
    // Check if user needs verification
    setShowVerificationBanner(user.is_muffled || !user.is_verified);
  }, [user]);

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user.username}
          </h1>
          <p className="text-secondary">
            Ready to share your voice or discover new insights?
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 bg-card/50 backdrop-blur-xl border-primary/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rank.gradient} flex items-center justify-center text-2xl`}>
                {rank.icon}
              </div>
              <div>
                <h3 className="font-semibold">{rank.name}</h3>
                <p className="text-sm text-secondary">{user.echoes} echoes</p>
              </div>
            </div>
            <div className="text-xs text-secondary">
              {rank.max === Infinity
                ? "You've reached the highest rank!"
                : `${rank.max - user.echoes + 1} echoes to next rank`
              }
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6 bg-card/50 backdrop-blur-xl border-primary/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Reviews</h3>
            </div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-secondary">Helpful contributions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6 bg-card/50 backdrop-blur-xl border-primary/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Impact</h3>
            </div>
            <p className="text-2xl font-bold">89</p>
            <p className="text-xs text-secondary">Total upvotes received</p>
          </motion.div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6 bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/50 transition-all duration-300 cursor-pointer"
            onClick={() => window.location.href = '/courses'}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Review a Course</h3>
                <p className="text-secondary">Share your experience anonymously</p>
              </div>
            </div>
            <p className="text-sm text-secondary">
              Help fellow students make informed decisions about course selection.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6 bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/50 transition-all duration-300 cursor-pointer"
            onClick={() => window.location.href = '/professors'}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Review a Professor</h3>
                <p className="text-secondary">Rate teaching and mentorship</p>
              </div>
            </div>
            <p className="text-sm text-secondary">
              Provide valuable feedback about professors and their teaching methods.
            </p>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6 bg-card/50 backdrop-blur-xl border-primary/20"
        >
          <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              {
                type: "review",
                content: "Reviewed Computer Networks",
                time: "2 hours ago",
                echoes: "+10"
              },
              {
                type: "upvote",
                content: "Your review was upvoted",
                time: "5 hours ago",
                echoes: "+1"
              },
              {
                type: "reply",
                content: "Someone replied to your review",
                time: "1 day ago",
                echoes: ""
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm">{activity.content}</p>
                    <p className="text-xs text-secondary">{activity.time}</p>
                  </div>
                </div>
                {activity.echoes && (
                  <span className="text-sm text-primary font-medium">
                    {activity.echoes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}