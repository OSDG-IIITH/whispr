"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Users,
  GraduationCap,
  Plus,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReplyForm } from "@/components/replies/ReplyForm";
import { ReplyList } from "@/components/replies/ReplyList";
import {
  professorAPI,
  reviewAPI,
  voteAPI,
  replyAPI,
  Professor,
  Review,
  Vote,
} from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";
import { convertReplyToFrontendReply } from "@/types/frontend-models";
import Loader from "@/components/common/Loader";

export default function ProfessorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const { user, refresh } = useAuth();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(
    null
  );
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [repliesByReview, setRepliesByReview] = useState<Record<string, any[]>>(
    {}
  );
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(
    null
  );
  const [highlightedReplyId, setHighlightedReplyId] = useState<string | null>(
    null
  );

  const professorId = params.id as string;

  const fetchProfessorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch professor details
      const professorData = await professorAPI.getProfessor(professorId);
      setProfessor(professorData);

      // Fetch professor reviews
      const reviewsData = await reviewAPI.getReviews({
        professor_id: professorData.id,
        skip: 0,
        limit: 100,
      });
      setReviews(reviewsData);

      // Fetch user votes if logged in
      if (user) {
        try {
          const votes = await voteAPI.getMyVotes();
          setUserVotes(votes);
        } catch (err) {
          console.error("Error fetching user votes:", err);
          // Don't fail the whole page if votes can't be loaded
        }
      }
    } catch (err) {
      console.error("Error fetching professor data:", err);
      setError("Failed to load professor data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [professorId, user]);

  // Fetch replies for all reviews
  const fetchRepliesForReviews = useCallback(async (reviews: Review[]) => {
    const repliesObj: Record<string, any[]> = {};
    await Promise.all(
      reviews.map(async (review) => {
        const replies = await replyAPI.getReplies({ review_id: review.id });
        // Transform replies to FrontendReply
        repliesObj[review.id] = replies.map((reply: any) =>
          convertReplyToFrontendReply(reply)
        );
      })
    );
    setRepliesByReview(repliesObj);
  }, []);

  // Fetch reviews and their replies
  const fetchReviewsAndReplies = useCallback(async () => {
    if (!professor) return;
    try {
      const reviewsData = await reviewAPI.getReviews({
        professor_id: professor.id,
      });
      setReviews(reviewsData);
      await fetchRepliesForReviews(reviewsData);
      // Also refresh user votes if logged in
      if (user) {
        try {
          const votes = await voteAPI.getMyVotes();
          setUserVotes(votes);
        } catch (err) {
          console.error("Error fetching user votes:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  }, [professor, user, fetchRepliesForReviews]);

  // Replace fetchReviews with fetchReviewsAndReplies
  useEffect(() => {
    if (professorId) {
      fetchProfessorData();
    }
  }, [professorId, fetchProfessorData]);

  useEffect(() => {
    if (professor) {
      fetchReviewsAndReplies();
    }
  }, [professor, fetchReviewsAndReplies]);

  // Handle query parameters for highlighting and scrolling to specific reviews/replies
  useEffect(() => {
    if (reviews.length > 0) {
      const reviewId = searchParams.get("reviewId");
      const replyId = searchParams.get("replyId");

      if (reviewId) {
        setHighlightedReviewId(reviewId);

        // Scroll to the review after a short delay to ensure it's rendered
        setTimeout(() => {
          const reviewElement = document.getElementById(`review-${reviewId}`);
          if (reviewElement) {
            reviewElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Flash highlight effect
            setTimeout(() => setHighlightedReviewId(null), 3000);
          }
        }, 500);
      }

      if (replyId) {
        setHighlightedReplyId(replyId);

        // Scroll to the reply after a short delay
        setTimeout(() => {
          const replyElement = document.getElementById(`reply-${replyId}`);
          if (replyElement) {
            replyElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Flash highlight effect
            setTimeout(() => setHighlightedReplyId(null), 3000);
          }
        }, 500);
      }
    }
  }, [reviews, repliesByReview, searchParams]);

  // Helper function to get user's vote for a specific review
  const getUserVoteForReview = (reviewId: string): "up" | "down" | null => {
    const userVote = userVotes.find((vote) => vote.review_id === reviewId);
    if (!userVote) return null;
    return userVote.vote_type ? "up" : "down";
  };

  // Helper: get user's vote for a specific reply
  const getUserVoteForReply = (replyId: string): "up" | "down" | null => {
    const userVote = userVotes.find((vote) => vote.reply_id === replyId);
    if (!userVote) return null;
    return userVote.vote_type ? "up" : "down";
  };

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    if (!user) {
      showError("Please log in to vote");
      return;
    }

    // Find the current review
    const currentReview = reviews.find((r) => r.id === reviewId);
    if (!currentReview) return;

    const currentUserVote = getUserVoteForReview(reviewId);
    const isUpvote = type === "up";

    // Calculate optimistic updates
    let newUpvotes = currentReview.upvotes;
    let newDownvotes = currentReview.downvotes;
    let newUserVote: "up" | "down" | null = null;

    if (currentUserVote === null) {
      // User hasn't voted yet
      if (isUpvote) {
        newUpvotes += 1;
        newUserVote = "up";
      } else {
        newDownvotes += 1;
        newUserVote = "down";
      }
    } else if (currentUserVote === type) {
      // User is removing their vote (clicking same button)
      if (isUpvote) {
        newUpvotes -= 1;
      } else {
        newDownvotes -= 1;
      }
      newUserVote = null;
    } else {
      // User is switching their vote
      if (currentUserVote === "up") {
        newUpvotes -= 1;
        newDownvotes += 1;
      } else {
        newUpvotes += 1;
        newDownvotes -= 1;
      }
      newUserVote = type;
    }

    // Optimistically update the UI
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.id === reviewId
          ? { ...review, upvotes: newUpvotes, downvotes: newDownvotes }
          : review
      )
    );

    // Optimistically update user votes
    setUserVotes((prevVotes) => {
      const filteredVotes = prevVotes.filter((v) => v.review_id !== reviewId);
      if (newUserVote !== null) {
        filteredVotes.push({
          id: `temp-${reviewId}`,
          user_id: user.id,
          review_id: reviewId,
          reply_id: undefined,
          vote_type: newUserVote === "up",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return filteredVotes;
    });

    try {
      if (newUserVote === null) {
        // User is removing their vote - find and delete the existing vote
        const existingVote = userVotes.find((v) => v.review_id === reviewId);
        if (existingVote) {
          await voteAPI.deleteVote(existingVote.id);
        }
      } else {
        // User is creating or updating their vote
        await voteAPI.createVote({
          review_id: reviewId,
          vote_type: isUpvote,
        });
      }

      // Refresh user votes to get the correct vote data
      if (user) {
        try {
          const votes = await voteAPI.getMyVotes();
          setUserVotes(votes);
        } catch (err) {
          console.error("Error refreshing user votes:", err);
        }
      }

      // Only refresh user data for echo points if voting on someone else's review
      // (users don't get echo points for voting on their own content)
      if (currentReview.user_id !== user.id) {
        await refresh();
      }
    } catch (err: any) {
      console.error("Error voting on review:", err);
      showError(err.message || "Failed to vote. Please try again.");

      // Revert optimistic update on error
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                upvotes: currentReview.upvotes,
                downvotes: currentReview.downvotes,
              }
            : review
        )
      );

      // Revert user votes on error
      if (user) {
        try {
          const votes = await voteAPI.getMyVotes();
          setUserVotes(votes);
        } catch (err) {
          console.error("Error refreshing user votes:", err);
        }
      }
    }
  };

  const handleReplyVote = async (replyId: string, type: "up" | "down") => {
    if (!user) {
      showError("Please log in to vote");
      return;
    }
    if (user.is_muffled) {
      showError("Muffled users cannot vote");
      return;
    }

    // Find the current reply
    let currentReply: any = null;
    let reviewId: string | null = null;

    for (const [revId, replies] of Object.entries(repliesByReview)) {
      const reply = replies.find((r) => r.id === replyId);
      if (reply) {
        currentReply = reply;
        reviewId = revId;
        break;
      }
    }

    if (!currentReply || !reviewId) return;

    const currentUserVote = getUserVoteForReply(replyId);
    const isUpvote = type === "up";

    // Calculate optimistic updates
    let newUpvotes = currentReply.upvotes;
    let newDownvotes = currentReply.downvotes;
    let newUserVote: "up" | "down" | null = null;

    if (currentUserVote === null) {
      // User hasn't voted yet
      if (isUpvote) {
        newUpvotes += 1;
        newUserVote = "up";
      } else {
        newDownvotes += 1;
        newUserVote = "down";
      }
    } else if (currentUserVote === type) {
      // User is removing their vote (clicking same button)
      if (isUpvote) {
        newUpvotes -= 1;
      } else {
        newDownvotes -= 1;
      }
      newUserVote = null;
    } else {
      // User is switching their vote
      if (currentUserVote === "up") {
        newUpvotes -= 1;
        newDownvotes += 1;
      } else {
        newUpvotes += 1;
        newDownvotes -= 1;
      }
      newUserVote = type;
    }

    // Optimistically update the UI
    setRepliesByReview((prevReplies) => ({
      ...prevReplies,
      [reviewId]: prevReplies[reviewId].map((reply) =>
        reply.id === replyId
          ? { ...reply, upvotes: newUpvotes, downvotes: newDownvotes }
          : reply
      ),
    }));

    // Optimistically update user votes
    setUserVotes((prevVotes) => {
      const filteredVotes = prevVotes.filter((v) => v.reply_id !== replyId);
      if (newUserVote !== null) {
        filteredVotes.push({
          id: `temp-${replyId}`,
          user_id: user.id,
          review_id: undefined,
          reply_id: replyId,
          vote_type: newUserVote === "up",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return filteredVotes;
    });

    try {
      if (newUserVote === null) {
        // User is removing their vote - find and delete the existing vote
        const existingVote = userVotes.find((v) => v.reply_id === replyId);
        if (existingVote) {
          await voteAPI.deleteVote(existingVote.id);
        }
      } else {
        // User is creating or updating their vote
        await voteAPI.createVote({
          reply_id: replyId,
          vote_type: isUpvote,
        });
      }

      // Refresh user votes to get the correct vote data
      if (user) {
        try {
          const votes = await voteAPI.getMyVotes();
          setUserVotes(votes);
        } catch (err) {
          console.error("Error refreshing user votes:", err);
        }
      }

      // Refresh user data to get updated echo points
      await refresh();
    } catch (err: any) {
      console.error("Error voting on reply:", err);
      showError(err.message || "Failed to vote. Please try again.");

      // Revert optimistic update on error
      setRepliesByReview((prevReplies) => ({
        ...prevReplies,
        [reviewId]: prevReplies[reviewId].map((reply) =>
          reply.id === replyId
            ? {
                ...reply,
                upvotes: currentReply.upvotes,
                downvotes: currentReply.downvotes,
              }
            : reply
        ),
      }));

      // Revert user votes on error
      if (user) {
        try {
          const votes = await voteAPI.getMyVotes();
          setUserVotes(votes);
        } catch (err) {
          console.error("Error refreshing user votes:", err);
        }
      }
    }
  };

  const handleReply = async (reviewId: string, content?: string) => {
    if (!user) {
      showError("Please log in to reply");
      return;
    }
    if (!content) {
      // Open the reply box for this review
      setActiveReplyReviewId(reviewId);
      return;
    }
    setReplySubmitting(true);
    try {
      await replyAPI.createReply({
        review_id: reviewId,
        content: content,
      });
      await fetchReviewsAndReplies();
      showSuccess("Reply submitted successfully!");
      setActiveReplyReviewId(null);
    } catch (err: any) {
      console.error("Error creating reply:", err);
      showError(err.message || "Failed to create reply. Please try again.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleSubmitReview = async (data: {
    content: string;
    rating: number;
  }) => {
    if (!professor) return;

    if (!user) {
      showError("Please log in to submit a review");
      return;
    }

    try {
      setSubmittingReview(true);

      const newReview = await reviewAPI.createReview({
        professor_id: professor.id,
        rating: data.rating,
        content: data.content || undefined, // Handle empty content properly
      });

      // Add the new review to the list
      setReviews((prevReviews: Review[]) => [newReview, ...prevReviews]);

      // Update professor stats
      if (professor) {
        setProfessor((prevProfessor: Professor | null) =>
          prevProfessor
            ? {
                ...prevProfessor,
                review_count: prevProfessor.review_count + 1,
                average_rating: String(
                  (parseFloat(prevProfessor.average_rating) *
                    prevProfessor.review_count +
                    data.rating) /
                    (prevProfessor.review_count + 1)
                ),
              }
            : null
        );
      }

      setShowReviewForm(false);
      showSuccess("Review submitted successfully!");
    } catch (err: any) {
      console.error("Error submitting review:", err);
      const errorMessage =
        err?.message || "Failed to submit review. Please try again.";
      showError(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Refresh professor data function
  const refreshProfessorData = async () => {
    if (!professor?.id) return;

    try {
      const refreshedProfessor = await professorAPI.getProfessor(professor.id);
      setProfessor(refreshedProfessor);
    } catch (error) {
      console.error("Failed to refresh professor data:", error);
    }
  };

  // Update handleEdit to refresh professor data
  const handleEdit = async (
    reviewId: string,
    data?: { content?: string; rating?: number }
  ) => {
    if (!data) return;

    try {
      await reviewAPI.updateReview(reviewId, data);

      // Update the specific review in local state
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId
            ? { ...review, ...data, is_edited: true }
            : review
        )
      );

      // Refresh the professor data to update rating
      await refreshProfessorData();

      showSuccess("Review updated successfully!");
    } catch (error: any) {
      console.error("Failed to edit review:", error);
      showError(error.message || "Failed to edit review. Please try again.");
    }
  };

  // Update handleDelete to refresh professor data
  const handleDelete = async (reviewId: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      try {
        await reviewAPI.deleteReview(reviewId);

        // Remove from local state
        setReviews(reviews.filter((review) => review.id !== reviewId));

        // Refresh the professor data to update rating
        await refreshProfessorData();

        showSuccess("Review deleted successfully!");
      } catch (error) {
        console.error("Failed to delete review:", error);
        showError("Failed to delete review. Please try again.");
      }
    }
  };

  // Add reply edit and delete handlers
  const handleReplyEdit = async (replyId: string, content: string) => {
    try {
      await replyAPI.updateReply(replyId, { content });
      await fetchReviewsAndReplies();
      showSuccess("Reply updated successfully!");
    } catch (error: any) {
      console.error("Failed to edit reply:", error);
      showError(error?.message || "Failed to edit reply. Please try again.");
    }
  };

  const handleReplyDelete = async (replyId: string) => {
    try {
      await replyAPI.deleteReply(replyId);
      await fetchReviewsAndReplies();
      showSuccess("Reply deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete reply:", error);
      showError(error?.message || "Failed to delete reply. Please try again.");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating)
            ? "text-yellow-500 fill-current"
            : "text-secondary"
        }`}
      />
    ));
  };

  // Get courses taught by professor from course instructors
  const getCourses = (professor: Professor) => {
    if (
      !professor.course_instructors ||
      professor.course_instructors.length === 0
    ) {
      return [];
    }

    // Get unique courses with details
    const coursesMap = new Map();
    professor.course_instructors.forEach((instructor) => {
      if (instructor.course) {
        const key = instructor.course.id;
        if (!coursesMap.has(key)) {
          coursesMap.set(key, {
            code: instructor.course.code,
            name: instructor.course.name,
            semester: instructor.semester,
            year: instructor.year,
          });
        }
      }
    });

    return Array.from(coursesMap.values());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-secondary">Loading professor...</p>
        </div>
      </div>
    );
  }

  if (error || !professor) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Professor Not Found</h3>
          <p className="text-secondary mb-4">
            {error || "The requested professor could not be found."}
          </p>
          <button onClick={() => router.back()} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const courses = getCourses(professor);

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Professors
        </motion.button>

        {/* Professor Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-xl p-4 sm:p-8 mb-8"
        >
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-green-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>

            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold mb-2">
                {professor.name}
              </h1>
              {professor.lab && (
                <p className="text-primary text-lg mb-4">{professor.lab}</p>
              )}
              {professor.review_summary && (
                <p className="text-secondary leading-relaxed text-sm sm:text-base">
                  {professor.review_summary}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(parseFloat(professor.average_rating) || 0)}
              </div>
              <span className="font-semibold text-lg">
                {(parseFloat(professor.average_rating) || 0).toFixed(1)}
              </span>
              <span className="text-secondary">
                ({professor.review_count || 0} reviews)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              <span>{courses.length} courses taught</span>
            </div>
          </div>

          {/* Courses */}
          {courses.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Courses Taught</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {courses.map((course, index) => (
                  <div key={index} className="bg-muted p-4 rounded-lg">
                    <div className="font-medium text-primary">
                      {course.code}
                    </div>
                    <div className="font-medium">{course.name}</div>
                    {course.semester && course.year && (
                      <div className="text-sm text-secondary">
                        {course.semester} {course.year}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Media */}
          {professor.social_media && professor.social_media.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Links</h3>
              <div className="flex flex-wrap gap-3">
                {professor.social_media.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              onClick={() => {
                if (!user) {
                  showError("Please log in to submit a review");
                } else if (user.is_muffled) {
                  showError("Please verify your account to rate and review.");
                } else {
                  setShowReviewForm(true);
                }
              }}
              className="btn btn-primary px-4 py-3 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto"
              disabled={submittingReview}
            >
              <Plus className="w-4 h-4" />
              {submittingReview
                ? "Submitting..."
                : user
                ? "Rate & Review"
                : "Login to Review"}
            </button>
          </div>
        </motion.div>

        {/* Review Form */}
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <ReviewForm
              onSubmit={handleSubmitReview}
              onCancel={() => setShowReviewForm(false)}
              placeholder={`Share your experience with ${professor.name}...`}
              disabled={submittingReview}
            />
          </motion.div>
        )}

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-2 sm:gap-0">
            <h3 className="text-lg sm:text-2xl font-bold">
              Reviews ({reviews.length})
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-secondary text-xs sm:text-base">Sort:</span>
              {["newest", "oldest", "rating"].map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${
                    sortBy === option
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
            reviews={reviews.map((review) => ({
              id: review.id,
              author: {
                username: review.user?.username || "Anonymous",
                echoes: review.user?.echoes || 0,
                isVerified: !review.user?.is_muffled,
              },
              content: review.content || "",
              rating: review.rating,
              upvotes: review.upvotes,
              downvotes: review.downvotes,
              replyCount: repliesByReview[review.id]?.length || 0,
              createdAt: review.created_at,
              isEdited: review.is_edited,
              userVote: getUserVoteForReview(review.id),
              isOwn: user ? review.user_id === user.id : false,
              isHighlighted: highlightedReviewId === review.id,
            }))}
            onVote={handleVote}
            onReply={(reviewId) => handleReply(reviewId)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage={`No reviews yet for ${professor.name}. Be the first to share your experience!`}
            renderExtra={(review) => (
              <>
                {activeReplyReviewId === review.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-2"
                  >
                    <ReplyForm
                      onSubmit={async (content) =>
                        await handleReply(review.id, content)
                      }
                      onCancel={() => setActiveReplyReviewId(null)}
                      disabled={replySubmitting}
                    />
                  </motion.div>
                )}
                <ReplyList
                  replies={(repliesByReview[review.id] || []).map((reply) => ({
                    ...reply,
                    userVote: getUserVoteForReply(reply.id),
                    isHighlighted: highlightedReplyId === reply.id,
                  }))}
                  reviewId={review.id}
                  onVote={handleReplyVote}
                  onSubmitReply={async (reviewId, content) =>
                    await handleReply(reviewId, content)
                  }
                  onEdit={handleReplyEdit}
                  onDelete={handleReplyDelete}
                />
              </>
            )}
          />
        </motion.div>
      </div>
    </div>
  );
}
