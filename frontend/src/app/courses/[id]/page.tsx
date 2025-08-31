"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, BookOpen, Plus, ArrowLeft } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewSortSelector } from "@/components/reviews/ReviewSortSelector";
import { ReplyForm } from "@/components/replies/ReplyForm";
import { ReplyList } from "@/components/replies/ReplyList";
import {
  courseAPI,
  reviewAPI,
  voteAPI,
  replyAPI,
} from "@/lib/api";
import { Course, Review, Vote, Reply, User } from "@/types/backend-models";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  convertReplyToFrontendReply,
  FrontendReply,
} from "@/types/frontend-models";
import Loader from "@/components/common/Loader";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const { user, refresh } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState("date_new");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(
    null
  );
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [repliesByReview, setRepliesByReview] = useState<
    Record<string, FrontendReply[]>
  >({});
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(
    null
  );
  const [highlightedReplyId, setHighlightedReplyId] = useState<string | null>(
    null
  );

  const courseCode = params.id as string;

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const courseData = await courseAPI.getCourse(courseCode);
      setCourse(courseData);

      // Fetch course reviews
      // const reviewsData = await courseAPI.getCourseReviews(
      //   courseData.id,
      //   0,
      //   100
      // );
      // setReviews(reviewsData);

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
      console.error("Error fetching course data:", err);
      setError("Failed to load course data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [courseCode, user]);

  // Fetch replies for all reviews
  const fetchRepliesForReviews = useCallback(async (reviews: Review[]) => {
    const currentUserId = (user as User).id;
    const repliesObj: Record<string, FrontendReply[]> = {};
    await Promise.all(
      reviews.map(async (review) => {
        const replies = await replyAPI.getReplies({ review_id: review.id });
        // Transform replies to FrontendReply
        repliesObj[review.id] = replies.map((reply: Reply) => {
          // console.log("Raw reply from API:", reply); // See what the API returns
          // console.log("Reply user_id:", reply.user_id); // Check if user_id exists

          const frontendReply = convertReplyToFrontendReply(reply, null, currentUserId);
          // console.log("After conversion:", frontendReply); // See what conversion produces

          return frontendReply;
        });
      })
    );
    // console.log("The replies object:", repliesObj);
    setRepliesByReview(repliesObj);
    return repliesObj;
  }, [user]);

  // Fetch reviews and their replies
  const fetchReviewsAndReplies = useCallback(async () => {
    if (!course) return;
    try {
      const reviewsData = await reviewAPI.getReviews({
        course_id: course.id,
        sort_by: sortBy
      });
      setReviews(reviewsData);
      await fetchRepliesForReviews(reviewsData);
      // console.log("Fetched replies for reviews:", repliesData);
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
  }, [course, user, fetchRepliesForReviews, sortBy]);

  // Replace fetchReviews with fetchReviewsAndReplies
  useEffect(() => {
    if (courseCode) {
      fetchCourseData();
    }
  }, [courseCode, fetchCourseData]);

  useEffect(() => {
    if (course) {
      fetchReviewsAndReplies();
    }
  }, [course, fetchReviewsAndReplies, user, fetchRepliesForReviews, sortBy]);

  // Refetch reviews when sort order changes
  useEffect(() => {
    if (course && sortBy) {
      fetchReviewsAndReplies();
    }
  }, [course, sortBy, fetchReviewsAndReplies, user, fetchRepliesForReviews]);

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
    const currentUserId = (user as User).id;

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
      if (newUserVote !== null && user) {
        filteredVotes.push({
          id: `temp-${reviewId}`,
          user_id: currentUserId,
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
      if (user && currentReview.user_id !== (user as User).id) {
        await refresh();
      }
    } catch (err: unknown) {
      console.error("Error voting on review:", err);
      showError(
        err instanceof Error ? err.message : "Failed to vote. Please try again."
      );

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
    const currentUserId = (user as User).id;
    if ((user as User).is_muffled) {
      showError("Muffled users cannot vote");
      return;
    }

    // Find the current reply
    let currentReply: FrontendReply | null = null;
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
      if (newUserVote !== null && user) {
        filteredVotes.push({
          id: `temp-${replyId}`,
          user_id: currentUserId,
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

      // Only refresh user data for echo points if voting on someone else's reply
      // (users don't get echo points for voting on their own content)
      if (user && currentReply.user_id !== (user as User).id) {
        await refresh();
      }
    } catch (err: unknown) {
      console.error("Error voting on reply:", err);
      showError(
        err instanceof Error ? err.message : "Failed to vote. Please try again."
      );

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
    } catch (err: unknown) {
      console.error("Error creating reply:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Failed to create reply. Please try again."
      );
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleSubmitReview = async (data: {
    content: string;
    rating: number;
  }) => {
    if (!course) return;

    if (!user) {
      showError("Please log in to submit a review");
      return;
    }

    try {
      setSubmittingReview(true);

      const reviewData: {
        course_id: string;
        rating: number;
        content?: string;
        semester?: string;
        year?: number;
        professor_ids?: string[];
      } = {
        course_id: course.id,
        rating: data.rating,
        content: data.content || undefined, // Handle empty content properly
      };

      // Create the review via API and get the new review object
      const newReview = await reviewAPI.createReview(reviewData);

      // Add the new review to the list
      setReviews((prevReviews: Review[]) => [newReview, ...prevReviews]);

      // Update course stats
      if (course) {
        setCourse((prevCourse: Course | null) =>
          prevCourse
            ? {
              ...prevCourse,
              review_count: prevCourse.review_count + 1,
              average_rating: String(
                (parseFloat(prevCourse.average_rating) *
                  prevCourse.review_count +
                  data.rating) /
                (prevCourse.review_count + 1)
              ),
            }
            : null
        );
      }

      setShowReviewForm(false);
      showSuccess("Review submitted successfully!");
    } catch (err: unknown) {
      console.error("Error submitting review:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to submit review. Please try again.";
      showError(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Refresh course data function
  const refreshCourseData = async () => {
    if (!course?.id) return;

    try {
      const refreshedCourse = await courseAPI.refreshCourse(course.id);
      setCourse(refreshedCourse);
    } catch (error) {
      console.error("Failed to refresh course data:", error);
    }
  };

  // Update handleEdit to refresh course data
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

      // Refresh the course data to update rating
      await refreshCourseData();

      showSuccess("Review updated successfully!");
    } catch (error: unknown) {
      console.error("Failed to edit review:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to edit review. Please try again."
      );
    }
  };

  // Update handleDelete to refresh course data
  const handleDelete = async (reviewId: string) => {
    try {
      await reviewAPI.deleteReview(reviewId);

      // Remove from local state
      setReviews(reviews.filter((review) => review.id !== reviewId));

      // Refresh the course data to update rating
      await refreshCourseData();

      showSuccess("Review deleted successfully!");
    } catch (error) {
      console.error("Failed to delete review:", error);
      showError("Failed to delete review. Please try again.");
    }
  };

  // Add reply edit and delete handlers
  const handleReplyEdit = async (replyId: string, content: string) => {
    try {
      await replyAPI.updateReply(replyId, { content });
      await fetchReviewsAndReplies();
      showSuccess("Reply updated successfully!");
    } catch (error: unknown) {
      console.error("Failed to edit reply:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to edit reply. Please try again."
      );
    }
  };

  const handleReplyDelete = async (replyId: string) => {
    try {
      await replyAPI.deleteReply(replyId);
      await fetchReviewsAndReplies();
      showSuccess("Reply deleted successfully!");
    } catch (error: unknown) {
      console.error("Failed to delete reply:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to delete reply. Please try again."
      );
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.floor(rating)
          ? "text-yellow-500 fill-current"
          : "text-secondary"
          }`}
      />
    ));
  };

  const getProfessors = (course: Course) => {
    if (!course.course_instructors || course.course_instructors.length === 0) {
      return [];
    }

    // Get unique professors with id and name
    const professors = new Map<string, { id: string; name: string }>();
    course.course_instructors.forEach((instructor) => {
      if (instructor.professor) {
        professors.set(instructor.professor.id, {
          id: instructor.professor.id,
          name: instructor.professor.name,
        });
      }
    });

    return Array.from(professors.values());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-secondary">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Course Not Found</h3>
          <p className="text-secondary mb-4">
            {error || "The requested course could not be found."}
          </p>
          <button onClick={() => router.back()} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const professors = getProfessors(course);

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
          Back to Courses
        </motion.button>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-xl p-4 sm:p-8 mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div className="flex-1">
              {/* Course Info Row: code, credits, name */}
              <div className="flex items-center justify-between mb-2 w-full">
                <h1 className="text-xl sm:text-3xl font-bold text-primary">
                  {course.code}
                </h1>
                <span className="px-3 py-1 bg-primary/20 text-primary text-xs sm:text-sm rounded-full">
                  {course.credits} Credits
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-semibold break-words mb-4">
                {course.name}
              </h2>

              {/* Professors */}
              {professors.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {professors.map((professor, i) => (
                      <span
                        key={i}
                        className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() =>
                          router.push(`/professors/${professor.id}`)
                        }
                      >
                        {professor.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-secondary leading-relaxed text-sm sm:text-base break-words">
                {course.description || "No description available"}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(parseFloat(course.average_rating) || 0)}
              </div>
              <span className="font-semibold">
                {(parseFloat(course.average_rating) || 0).toFixed(1)}
              </span>
              <span className="text-secondary text-xs sm:text-sm">
                ({course.review_count || 0}{" "}
                {course.review_count === 1 ? "review" : "reviews"})
              </span>
            </div>

            {course.official_document_url && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                <a
                  href={course.official_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors text-xs sm:text-base"
                >
                  Course Syllabus
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              onClick={() => {
                if (!user) {
                  showError("Please log in to submit a review");
                } else if ((user as User).is_muffled && !(user as User).is_banned) {
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
              placeholder={`Share your experience with ${course.name}...`}
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
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <h3 className="text-lg sm:text-2xl font-bold">Reviews</h3>
            <ReviewSortSelector
              sortBy={sortBy}
              onSortChange={setSortBy}
              className="w-full sm:w-auto"
            />
          </div>

          <ReviewList
            reviews={reviews
              .map((review) => ({
                id: review.id,
                author: {
                  username: review.user?.username || "Anonymous",
                  echoes: review.user?.echoes || 0,
                  isVerified: !review.user?.is_muffled,
                  isBanned: review.user?.is_banned || false,
                },
                content: review.content || "",
                rating: review.rating,
                upvotes: review.upvotes,
                downvotes: review.downvotes,
                replyCount: repliesByReview[review.id]?.length || 0,
                createdAt: review.created_at,
                isEdited: review.is_edited,
                userVote: getUserVoteForReview(review.id),
                isOwn: user ? review.user_id === (user as User).id : false,
                isHighlighted: highlightedReviewId === review.id,
              }))}
            onVote={handleVote}
            onReply={(reviewId) => handleReply(reviewId)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage={`No reviews yet for ${course.name}. Be the first to share your experience!`}
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
                    // isOwn: user ? reply.user_id === (user as User).id : false,
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
