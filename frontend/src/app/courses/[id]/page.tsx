"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Users,
  BookOpen,
  Calendar,
  Plus,
  ArrowLeft,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReplyForm } from "@/components/replies/ReplyForm";
import { ReplyList } from "@/components/replies/ReplyList";
import {
  courseAPI,
  reviewAPI,
  voteAPI,
  replyAPI,
  Course,
  Review,
  Vote,
} from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";
import { convertReplyToFrontendReply } from "@/types/frontend-models";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { user, refresh } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
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

  const courseCode = params.id as string;

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const courseData = await courseAPI.getCourse(courseCode);
      setCourse(courseData);

      // Fetch course reviews
      const reviewsData = await courseAPI.getCourseReviews(
        courseData.id,
        0,
        100
      );
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
      console.error("Error fetching course data:", err);
      setError("Failed to load course data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [courseCode, user]);

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
    if (!course) return;
    try {
      const reviewsData = await reviewAPI.getReviews({ course_id: course.id });
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
  }, [course, user, fetchRepliesForReviews]);

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
  }, [course, fetchReviewsAndReplies]);

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

    try {
      await voteAPI.createVote({
        review_id: reviewId,
        vote_type: type === "up",
      });

      // Refresh reviews to show updated vote counts
      await fetchReviewsAndReplies();

      // Refresh user data to get updated echo points
      await refresh();
    } catch (err: any) {
      console.error("Error voting on review:", err);
      showError(err.message || "Failed to vote. Please try again.");
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
    try {
      await voteAPI.createVote({
        reply_id: replyId,
        vote_type: type === "up",
      });

      // Refresh reviews and replies to show updated vote counts
      await fetchReviewsAndReplies();

      // Refresh user data to get updated echo points
      await refresh();
    } catch (err: any) {
      console.error("Error voting on reply:", err);
      showError(err.message || "Failed to vote. Please try again.");
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
    if (!course) return;

    if (!user) {
      showError("Please log in to submit a review");
      return;
    }

    try {
      setSubmittingReview(true);

      const newReview = await reviewAPI.createReview({
        course_id: course.id,
        rating: data.rating,
        content: data.content || undefined, // Handle empty content properly
      });

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
    } catch (err: any) {
      console.error("Error submitting review:", err);
      const errorMessage =
        err?.message || "Failed to submit review. Please try again.";
      showError(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Add review edit and delete handlers
  const handleEdit = async (
    reviewId: string,
    data?: { content?: string; rating?: number }
  ) => {
    try {
      await reviewAPI.updateReview(reviewId, data || {});
      await fetchReviewsAndReplies();
      showSuccess("Review updated successfully!");
    } catch (error: any) {
      console.error("Failed to edit review:", error);
      showError(error?.message || "Failed to edit review. Please try again.");
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await reviewAPI.deleteReview(reviewId);
      await fetchReviewsAndReplies();
      showSuccess("Review deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete review:", error);
      showError(error?.message || "Failed to delete review. Please try again.");
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

  const formatTimeInfo = (course: Course) => {
    if (!course.course_instructors || course.course_instructors.length === 0) {
      return null;
    }

    // Get unique semester/year combinations
    const timeSlots = new Set<string>();
    course.course_instructors.forEach((instructor) => {
      if (instructor.semester && instructor.year) {
        timeSlots.add(`${instructor.semester} ${instructor.year}`);
      }
    });

    return Array.from(timeSlots).join(", ");
  };

  const getProfessors = (course: Course) => {
    if (!course.course_instructors || course.course_instructors.length === 0) {
      return [];
    }

    // Get unique professors
    const professors = new Map<string, string>();
    course.course_instructors.forEach((instructor) => {
      if (instructor.professor) {
        professors.set(instructor.professor.id, instructor.professor.name);
      }
    });

    return Array.from(professors.values());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
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

  const timeInfo = formatTimeInfo(course);
  const professors = getProfessors(course);

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
          Back to Courses
        </motion.button>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/20 rounded-xl p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {/* Time Info - More Prominent */}
              {timeInfo && (
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-primary">
                    {timeInfo}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-primary">
                  {course.code}
                </h1>
                <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                  {course.credits} Credits
                </span>
              </div>
              <h2 className="text-2xl font-semibold mb-4">{course.name}</h2>

              {/* Professors */}
              {professors.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {professors.map((professor, i) => (
                      <span
                        key={i}
                        className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full"
                      >
                        {professor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-secondary leading-relaxed">
                {course.description || "No description available"}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(parseFloat(course.average_rating) || 0)}
              </div>
              <span className="font-semibold">
                {(parseFloat(course.average_rating) || 0).toFixed(1)}
              </span>
              <span className="text-secondary">
                ({course.review_count || 0} reviews)
              </span>
            </div>

            {course.official_document_url && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                <a
                  href={course.official_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Course Syllabus
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
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
              className="btn btn-primary px-6 py-3 flex items-center gap-2"
              disabled={submittingReview}
            >
              <Plus className="w-4 h-4" />
              {submittingReview
                ? "Submitting..."
                : user
                ? "Rate & Review"
                : "Login to Review"}
            </button>
            <button className="btn btn-secondary px-6 py-3">
              View Professors
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Reviews ({reviews.length})</h3>

            <div className="flex items-center gap-2">
              <span className="text-secondary">Sort:</span>
              {["newest", "oldest", "rating", "helpful"].map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
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
                avatarUrl: review.user?.avatar_url,
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
