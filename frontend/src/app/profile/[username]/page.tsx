"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  TrendingUp,
  Settings,
  Flag,
  ArrowLeft,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user/UserAvatar";
import { RankBadge } from "@/components/user/RankBadge";
import { EchoesDisplay } from "@/components/user/EchoesDisplay";
import { ReviewList } from "@/components/reviews/ReviewList";
import { KillSwitch } from "@/components/common/KillSwitch";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { userAPI, reviewAPI, voteAPI, replyAPI } from "@/lib/api";
import type { User, Review, Vote } from "@/types/backend-models";
import {
  FrontendReview,
  convertReviewToFrontendReview,
} from "@/types/frontend-models";
import Loader from "@/components/common/Loader";

// Helper function to transform backend review to frontend format
const transformReview = (
  review: Review,
  userVotes: Vote[],
  isOwn: boolean
): FrontendReview => {
  const userVote = userVotes.find((vote) => vote.review_id === review.id);

  return {
    id: review.id,
    author: {
      username: review.user?.username || "Unknown",
      echoes: review.user?.echoes || 0,
      isVerified: review.user ? !review.user.is_muffled : false,
    },
    content: review.content || "",
    rating: review.rating,
    upvotes: review.upvotes,
    downvotes: review.downvotes,
    replyCount: 0, // TODO: Add reply count when replies are implemented
    createdAt: review.created_at,
    isEdited: review.is_edited,
    userVote: userVote ? (userVote.vote_type ? "up" : "down") : null,
    isOwn,
    courseName: review.course?.name || review.course_instructor?.course?.name,
    professorName:
      review.professor?.name || review.course_instructor?.professor?.name,
  };
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, refresh } = useAuth();
  const { showError, showSuccess } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKillSwitch, setShowKillSwitch] = useState(false);
  const [filterBy, setFilterBy] = useState("all");

  const username = params.username as string;
  const isOwnProfile = currentUser?.username === username;

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const userData = await userAPI.getUserByUsername(username);
      setProfileUser(userData);

      // Fetch user reviews
      const userReviews = await reviewAPI.getReviews({ user_id: userData.id });
      setReviews(userReviews);

      // Fetch current user's votes if authenticated
      if (currentUser) {
        const votes = await voteAPI.getMyVotes();
        setUserVotes(votes);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      showError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [username, currentUser, showError]);

  useEffect(() => {
    if (username) {
      fetchProfileData();
    }
  }, [username, fetchProfileData]);

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    try {
      await voteAPI.createVote({
        review_id: reviewId,
        vote_type: type === "up",
      });
      // Refresh votes and reviews
      if (currentUser) {
        const votes = await voteAPI.getMyVotes();
        setUserVotes(votes);
      }
      const userReviews = await reviewAPI.getReviews({
        user_id: profileUser!.id,
      });
      setReviews(userReviews);

      // Refresh user data to get updated echo points
      await refresh();
    } catch (error) {
      console.error("Failed to vote:", error);
      showError("Failed to vote. Please try again.");
    }
  };

  const handleReply = async (reviewId: string, content?: string) => {
    if (!currentUser) {
      showError("Please log in to reply");
      return;
    }

    if (!content) {
      showError("Reply content is required");
      return;
    }

    try {
      await replyAPI.createReply({
        review_id: reviewId,
        content: content,
      });

      // Refresh reviews to show updated reply counts
      const userReviews = await reviewAPI.getReviews({
        user_id: profileUser!.id,
      });
      setReviews(userReviews);
      showSuccess("Reply submitted successfully!");
    } catch (error: any) {
      console.error("Failed to create reply:", error);
      showError(error.message || "Failed to create reply. Please try again.");
    }
  };

  const handleEdit = async (
    reviewId: string,
    data?: { content?: string; rating?: number }
  ) => {
    if (!currentUser) {
      showError("Please log in to edit");
      return;
    }

    if (!data) {
      showError("No changes to make");
      return;
    }

    try {
      await reviewAPI.updateReview(reviewId, data);

      // Refresh reviews to show updated content
      const userReviews = await reviewAPI.getReviews({
        user_id: profileUser!.id,
      });
      setReviews(userReviews);
      showSuccess("Review updated successfully!");
    } catch (error: any) {
      console.error("Failed to edit review:", error);
      showError(error.message || "Failed to edit review. Please try again.");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!currentUser) {
      showError("Please log in to delete");
      return;
    }

    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await reviewAPI.deleteReview(reviewId);

      // Refresh reviews to remove deleted review
      const userReviews = await reviewAPI.getReviews({
        user_id: profileUser!.id,
      });
      setReviews(userReviews);
      showSuccess("Review deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete review:", error);
      showError(error.message || "Failed to delete review. Please try again.");
    }
  };

  const handleReport = (reviewId: string) => {
    console.log(`Reporting review ${reviewId}`);
    // TODO: Implement report functionality
  };

  const handleKillSwitch = async () => {
    console.log("Activating kill switch - deleting account");
    // TODO: Implement account deletion
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-4">User not found</p>
          <button onClick={() => router.back()} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Transform reviews to frontend format
  const transformedReviews = reviews.map((review) =>
    transformReview(review, userVotes, isOwnProfile)
  );

  // Calculate stats from actual data
  const totalUpvotes = reviews.reduce((sum, review) => sum + review.upvotes, 0);
  const totalDownvotes = reviews.reduce(
    (sum, review) => sum + review.downvotes,
    0
  );
  const followersCount = 0; // TODO: Implement followers when backend supports it
  const profileViews = 0; // TODO: Implement profile views when backend supports it

  const stats = [
    {
      label: "Reviews",
      value: reviews.length,
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    },
    {
      label: "Upvotes",
      value: totalUpvotes,
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
    },
    {
      label: "Profile Views",
      value: profileViews,
      icon: <Settings className="w-5 h-5 text-purple-500" />,
    },
    {
      label: "Followers",
      value: followersCount,
      icon: <Calendar className="w-5 h-5 text-yellow-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-xl p-8 mb-8"
        >
          <div className="flex items-start gap-6 mb-6">
            <UserAvatar
              username={profileUser.username}
              echoes={profileUser.echoes}
              size="xl"
            />

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{profileUser.username}</h1>
                {!profileUser.is_muffled && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-black text-sm">✓</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <RankBadge echoes={profileUser.echoes} size="lg" showProgress />
              </div>

              <div className="mb-4">
                <EchoesDisplay echoes={profileUser.echoes} size="lg" />
              </div>

              {profileUser.bio && (
                <p className="text-secondary leading-relaxed mb-4">
                  {profileUser.bio}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-secondary">
                {profileUser.student_since_year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Student since {profileUser.student_since_year}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>Joined {formatDate(profileUser.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowKillSwitch(true)}
                  className="btn text-red-400 border-red-400/50 hover:bg-red-400/10 px-4 py-2 text-sm"
                >
                  Kill Switch
                </button>
              ) : (
                <>
                  <button className="btn btn-primary px-4 py-2">Follow</button>
                  <button className="btn btn-secondary px-4 py-2 flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-muted/50 rounded-lg p-4 text-center"
              >
                <div className="flex justify-center mb-2">{stat.icon}</div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-sm text-secondary">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">
              Reviews ({transformedReviews.length})
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-secondary">Filter:</span>
              {["all", "courses", "professors"].map((option) => (
                <button
                  key={option}
                  onClick={() => setFilterBy(option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterBy === option
                      ? "bg-primary text-black"
                      : "bg-muted text-secondary hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <ReviewList
            reviews={transformedReviews}
            onVote={handleVote}
            onReply={handleReply}
            onEdit={isOwnProfile ? handleEdit : undefined}
            onDelete={isOwnProfile ? handleDelete : undefined}
            onReport={!isOwnProfile ? handleReport : undefined}
            emptyMessage={`${profileUser.username} hasn't written any reviews yet.`}
          />
        </motion.div>

        {/* Kill Switch Modal */}
        <KillSwitch
          isOpen={showKillSwitch}
          onClose={() => setShowKillSwitch(false)}
          onConfirm={handleKillSwitch}
        />
      </div>
    </div>
  );
}
