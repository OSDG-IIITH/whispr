"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Filter, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { ReviewList } from "@/components/reviews/ReviewList";
import { reviewAPI, voteAPI, replyAPI, reportAPI } from "@/lib/api";
import type { Review, Vote } from "@/lib/api";

// Helper function to transform backend review to frontend format
const transformReview = (review: Review, userVotes: Vote[]) => {
  const userVote = userVotes.find((vote) => vote.review_id === review.id);
  const voteType = userVote
    ? userVote.vote_type
      ? ("up" as const)
      : ("down" as const)
    : null;

  return {
    id: review.id,
    author: {
      username: review.user?.username || "Unknown",
      echoes: review.user?.echoes || 0,
      isVerified: !review.user?.is_muffled,
      avatarUrl: review.user?.avatar_url,
    },
    content: review.content || "",
    rating: review.rating,
    upvotes: review.upvotes,
    downvotes: review.downvotes,
    replyCount: 0, // TODO: Add reply count when replies are implemented
    createdAt: review.created_at,
    isEdited: review.is_edited,
    userVote: voteType,
    isOwn: true,
    courseName: review.course?.name || review.course_instructor?.course?.name,
    professorName:
      review.professor?.name || review.course_instructor?.professor?.name,
  };
};

export default function MyReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUserReviews = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userReviews = await reviewAPI.getReviews({ user_id: user.id });
      setReviews(userReviews);
    } catch (error) {
      console.error("Failed to fetch user reviews:", error);
      showError("Failed to load your reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  const fetchUserVotes = useCallback(async () => {
    if (!user) return;

    try {
      const votes = await voteAPI.getMyVotes();
      setUserVotes(votes);
    } catch (error) {
      console.error("Failed to fetch user votes:", error);
      showError("Failed to load your votes. Please try again.");
    }
  }, [user, showError]);

  useEffect(() => {
    if (user) {
      fetchUserReviews();
      fetchUserVotes();
    }
  }, [user, fetchUserReviews, fetchUserVotes]);

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    try {
      await voteAPI.createVote({
        review_id: reviewId,
        vote_type: type === "up",
      });
      // Refresh votes and reviews
      await fetchUserVotes();
      await fetchUserReviews();
    } catch (error) {
      console.error("Failed to vote:", error);
      showError("Failed to vote. Please try again.");
    }
  };

  const handleReply = async (reviewId: string, content?: string) => {
    if (!content) {
      showError("Reply content cannot be empty");
      return;
    }

    try {
      await replyAPI.createReply({
        review_id: reviewId,
        content: content,
      });
      // Refresh to show the new reply
      await fetchUserReviews();
    } catch (error) {
      console.error("Failed to create reply:", error);
      showError("Failed to create reply. Please try again.");
    }
  };

  const handleEdit = async (
    reviewId: string,
    data?: { content?: string; rating?: number }
  ) => {
    if (!data) {
      showError("No changes to make");
      return;
    }

    try {
      await reviewAPI.updateReview(reviewId, data);

      // Refresh reviews to show updated content
      await fetchUserReviews();
      showSuccess("Review updated successfully!");
    } catch (error: any) {
      console.error("Failed to edit review:", error);
      showError(error.message || "Failed to edit review. Please try again.");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      try {
        await reviewAPI.deleteReview(reviewId);
        // Remove from local state
        setReviews(reviews.filter((review) => review.id !== reviewId));
      } catch (error) {
        console.error("Failed to delete review:", error);
        showError("Failed to delete review. Please try again.");
      }
    }
  };

  const handleReport = async (
    reviewId: string,
    reportType?: string,
    reason?: string
  ) => {
    if (!reportType) {
      showError("Please select a report type");
      return;
    }

    if (!reason) {
      showError("Please provide a reason for your report");
      return;
    }

    try {
      const validReportType = reportType as
        | "spam"
        | "harassment"
        | "inappropriate"
        | "misinformation"
        | "other";

      await reportAPI.createReport({
        review_id: reviewId,
        report_type: validReportType,
        reason: reason,
      });
      showSuccess(
        "Report submitted successfully. Thank you for helping keep our community safe."
      );
    } catch (error) {
      console.error("Failed to submit report:", error);
      showError("Failed to submit report. Please try again.");
    }
  };

  const transformedReviews = reviews.map((review) =>
    transformReview(review, userVotes)
  );

  const filteredReviews = transformedReviews.filter((review) => {
    // Filter by type
    if (filterBy === "courses" && !review.courseName) return false;
    if (filterBy === "professors" && !review.professorName) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const content = review.content.toLowerCase();
      const courseName = review.courseName?.toLowerCase() || "";
      const professorName = review.professorName?.toLowerCase() || "";

      if (
        !content.includes(query) &&
        !courseName.includes(query) &&
        !professorName.includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "rating":
        return b.rating - a.rating;
      case "helpful":
        return b.upvotes - b.downvotes - (a.upvotes - a.downvotes);
      default:
        return 0;
    }
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">My Reviews</h1>
          <p className="text-secondary">
            Manage and view all your course and professor reviews
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-card border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{reviews.length}</div>
                <div className="text-sm text-secondary">Total Reviews</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <span className="text-blue-500 text-lg">📚</span>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {reviews.filter((r) => r.courseName).length}
                </div>
                <div className="text-sm text-secondary">Course Reviews</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <span className="text-green-500 text-lg">👨‍🏫</span>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {reviews.filter((r) => r.professorName).length}
                </div>
                <div className="text-sm text-secondary">Professor Reviews</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <span className="text-yellow-500 text-lg">👍</span>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {reviews.reduce((sum, r) => sum + r.upvotes, 0)}
                </div>
                <div className="text-sm text-secondary">Total Upvotes</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-primary/20 rounded-xl p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  placeholder="Search your reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-secondary" />
                <span className="text-sm text-secondary">Filter:</span>
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

              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="rating">Rating</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reviews List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ReviewList
            reviews={sortedReviews}
            loading={loading}
            onVote={handleVote}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReport={handleReport}
            emptyMessage="You haven't written any reviews yet. Start sharing your experiences with courses and professors!"
          />
        </motion.div>
      </div>
    </div>
  );
}
