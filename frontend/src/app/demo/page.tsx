"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  Flag,
  Heart,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReplyList } from "@/components/replies/ReplyList";
import { ReportModal } from "@/components/common/ReportModal";
import { reviewAPI, replyAPI, voteAPI, reportAPI, userAPI } from "@/lib/api";
import type { Review, Reply, Vote } from "@/lib/api";

// Mock data for demonstration
const mockReviews = [
  {
    id: "1",
    author: {
      username: "student123",
      echoes: 25,
      isVerified: true,
      avatarUrl: undefined,
    },
    content:
      "This course was absolutely amazing! The professor explains concepts clearly and the assignments are very practical. I learned so much about data structures and algorithms. Highly recommend for anyone interested in computer science fundamentals.",
    rating: 5,
    upvotes: 12,
    downvotes: 2,
    replyCount: 3,
    createdAt: "2024-01-15T10:30:00Z",
    isEdited: false,
    userVote: null,
    isOwn: false,
  },
  {
    id: "2",
    author: {
      username: "codemaster",
      echoes: 45,
      isVerified: true,
      avatarUrl: undefined,
    },
    content:
      "Great professor, but the workload is quite heavy. Make sure you manage your time well. The projects are challenging but rewarding.",
    rating: 4,
    upvotes: 8,
    downvotes: 1,
    replyCount: 2,
    createdAt: "2024-01-10T14:20:00Z",
    isEdited: true,
    userVote: "up" as const,
    isOwn: false,
  },
];

const mockReplies = [
  {
    id: "1",
    author: {
      username: "helpfulstudent",
      echoes: 15,
      isVerified: true,
      avatarUrl: undefined,
    },
    content:
      "I totally agree! This course changed my perspective on programming. The assignments really help you understand the concepts deeply.",
    upvotes: 5,
    downvotes: 0,
    createdAt: "2024-01-16T09:15:00Z",
    isEdited: false,
    userVote: null,
    isOwn: false,
  },
];

export default function DemoPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [reviews, setReviews] = useState(mockReviews);
  const [replies, setReplies] = useState(mockReplies);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    type: "review" | "reply" | "user";
  } | null>(null);

  // Demo statistics
  const stats = {
    totalReviews: 1247,
    totalReplies: 3421,
    totalVotes: 8932,
    activeUsers: 567,
  };

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setReviews((prevReviews) =>
        prevReviews.map((review) => {
          if (review.id === reviewId) {
            const wasUpvoted = review.userVote === "up";
            const wasDownvoted = review.userVote === "down";

            let newUpvotes = review.upvotes;
            let newDownvotes = review.downvotes;
            let newUserVote: "up" | "down" | null = type;

            // Remove previous vote
            if (wasUpvoted) newUpvotes--;
            if (wasDownvoted) newDownvotes--;

            // Add new vote
            if (type === "up") {
              newUpvotes++;
              if (wasUpvoted) newUserVote = null; // Toggle off
            } else {
              newDownvotes++;
              if (wasDownvoted) newUserVote = null; // Toggle off
            }

            return {
              ...review,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              userVote: newUserVote,
            };
          }
          return review;
        })
      );

      showSuccess(`${type === "up" ? "Upvoted" : "Downvoted"} review!`);
    } catch (error) {
      showError("Failed to vote. Please try again.");
    }
  };

  const handleReplyVote = async (replyId: string, type: "up" | "down") => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setReplies((prevReplies) =>
        prevReplies.map((reply) => {
          if (reply.id === replyId) {
            const wasUpvoted = reply.userVote === "up";
            const wasDownvoted = reply.userVote === "down";

            let newUpvotes = reply.upvotes;
            let newDownvotes = reply.downvotes;
            let newUserVote: "up" | "down" | null = type;

            // Remove previous vote
            if (wasUpvoted) newUpvotes--;
            if (wasDownvoted) newDownvotes--;

            // Add new vote
            if (type === "up") {
              newUpvotes++;
              if (wasUpvoted) newUserVote = null; // Toggle off
            } else {
              newDownvotes++;
              if (wasDownvoted) newUserVote = null; // Toggle off
            }

            return {
              ...reply,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              userVote: newUserVote,
            };
          }
          return reply;
        })
      );

      showSuccess(`${type === "up" ? "Upvoted" : "Downvoted"} reply!`);
    } catch (error) {
      showError("Failed to vote. Please try again.");
    }
  };

  const handleReply = (reviewId: string) => {
    showSuccess("Reply functionality would open a compose form here!");
  };

  const handleSubmitReply = async (reviewId: string, content: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newReply = {
        id: Date.now().toString(),
        author: {
          username: user?.username || "anonymous",
          echoes: user?.echoes || 0,
          isVerified: !user?.is_muffled,
          avatarUrl: user?.avatar_url,
        },
        content,
        upvotes: 0,
        downvotes: 0,
        createdAt: new Date().toISOString(),
        isEdited: false,
        userVote: null,
        isOwn: true,
      };

      setReplies((prev) => [...prev, newReply]);
      showSuccess("Reply posted successfully!");
    } catch (error) {
      showError("Failed to post reply. Please try again.");
    }
  };

  const handleReport = async (
    targetId: string,
    reportType: string,
    reason: string
  ) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess(
        "Report submitted successfully. Thank you for helping keep the community safe!"
      );
    } catch (error) {
      showError("Failed to submit report. Please try again.");
    }
  };

  const handleOpenReport = (
    targetId: string,
    targetType: "review" | "reply" | "user"
  ) => {
    setReportTarget({ id: targetId, type: targetType });
    setShowReportModal(true);
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      showSuccess("User followed successfully!");
    } catch (error) {
      showError("Failed to follow user. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Whispr Feature Demo</h1>
          <p className="text-secondary text-lg">
            Experience all the implemented features: reviews, replies, votes,
            echo points, notifications, and reporting
          </p>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Star,
              label: "Reviews",
              value: stats.totalReviews,
              color: "text-yellow-400",
            },
            {
              icon: MessageSquare,
              label: "Replies",
              value: stats.totalReplies,
              color: "text-blue-400",
            },
            {
              icon: TrendingUp,
              label: "Votes",
              value: stats.totalVotes,
              color: "text-green-400",
            },
            {
              icon: Users,
              label: "Active Users",
              value: stats.activeUsers,
              color: "text-purple-400",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 bg-muted rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-secondary">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Sections */}
        <div className="space-y-12">
          {/* Reviews Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold">
                Reviews with Voting & Reporting
              </h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-secondary mb-6">
                Interactive reviews with upvote/downvote functionality, echo
                points calculation, and reporting system.
              </p>
              <ReviewList
                reviews={reviews}
                onVote={handleVote}
                onReply={handleReply}
                onReport={(reviewId, reportType, reason) =>
                  handleReport(reviewId, reportType, reason)
                }
              />
            </div>
          </motion.section>

          {/* Replies Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">
                Replies with Nested Interactions
              </h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-secondary mb-6">
                Reply system with voting, editing, and reporting capabilities.
              </p>
              <ReplyList
                replies={replies}
                reviewId="1"
                onVote={handleReplyVote}
                onSubmitReply={handleSubmitReply}
                onReport={(replyId, reportType, reason) =>
                  handleReport(replyId, reportType, reason)
                }
              />
            </div>
          </motion.section>

          {/* Echo Points & Notifications */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold">
                Echo Points & Notifications
              </h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-secondary mb-6">
                Automatic echo points calculation based on votes and
                notifications for user interactions.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Echo Points Calculation
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span>Review Upvote</span>
                      <span className="text-green-400">+1 Echo</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span>Review Downvote</span>
                      <span className="text-red-400">-1 Echo</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span>Reply Upvote</span>
                      <span className="text-green-400">+0.5 Echo</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span>Reply Downvote</span>
                      <span className="text-red-400">-0.5 Echo</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Notification Types
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium">Vote Notifications</div>
                      <div className="text-sm text-secondary">
                        When someone votes on your content
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium">Reply Notifications</div>
                      <div className="text-sm text-secondary">
                        When someone replies to your review
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium">Follow Notifications</div>
                      <div className="text-sm text-secondary">
                        When someone follows you
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium">Rank Change</div>
                      <div className="text-sm text-secondary">
                        When your echo points change significantly
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Follow & Report Features */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold">Follow & Report System</h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Follow System</h3>
                  <p className="text-secondary mb-4">
                    Users can follow each other to stay updated with their
                    activity.
                  </p>
                  <button
                    onClick={() => handleFollowUser("demo-user")}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    Demo Follow Action
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Report System</h3>
                  <p className="text-secondary mb-4">
                    Comprehensive reporting system for reviews, replies, and
                    users.
                  </p>
                  <button
                    onClick={() => handleOpenReport("demo", "review")}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Demo Report Action
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={(reportType, reason) => {
            if (reportTarget) {
              handleReport(reportTarget.id, reportType, reason);
            }
          }}
          targetType={reportTarget?.type || "review"}
          targetId={reportTarget?.id || ""}
        />
      </div>
    </div>
  );
}
