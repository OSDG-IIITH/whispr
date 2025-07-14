"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FrontendReview } from "@/types/frontend-models";
import { UserAvatar } from "@/components/user/UserAvatar";
import { FollowButton } from "@/components/user/FollowButton";
import { formatRelativeTime } from "@/lib/utils";

interface FeedReviewCardProps {
  review: FrontendReview;
  onVote: (reviewId: string, type: "up" | "down") => Promise<void>;
  onReply: (reviewId: string) => Promise<void>;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
  currentUserId?: string;
  showVoteButtons?: boolean;
}

export function FeedReviewCard({
  review,
  onVote,
  onReply,
  onFollowChange,
  currentUserId,
  showVoteButtons = true,
}: FeedReviewCardProps) {
  const router = useRouter();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (type: "up" | "down") => {
    if (isVoting) return;

    setIsVoting(true);
    try {
      await onVote(review.id, type);
    } catch (error) {
      console.error(`Failed to ${type}vote:`, error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReply = async () => {
    await onReply(review.id);
  };

  const handleCardClick = () => {
    // Navigate to the appropriate page based on review type
    if (review.course_id && review.course?.code) {
      router.push(`/courses/${review.course.code}`);
    } else if (review.professor_id && review.professor?.id) {
      router.push(`/professors/${review.professor.id}`);
    } else if (
      review.course_instructor_id &&
      review.course_instructor?.course?.code
    ) {
      router.push(`/courses/${review.course_instructor.course.code}`);
    } else {
      // Fallback: don't navigate if we don't have proper data
      console.warn("Cannot navigate: missing course/professor data", review);
    }
  };

  const renderSubject = () => {
    if (review.course_id && review.course) {
      return (
        <div className="flex items-center gap-2 text-sm text-secondary mb-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-medium">{review.course.code}</span>
          <span>•</span>
          <span>{review.course.name}</span>
        </div>
      );
    } else if (review.professor_id && review.professor) {
      return (
        <div className="flex items-center gap-2 text-sm text-secondary mb-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          <span className="font-medium">{review.professor.name}</span>
          {review.professor.lab && (
            <>
              <span>•</span>
              <span>{review.professor.lab}</span>
            </>
          )}
        </div>
      );
    } else if (review.course_instructor_id && review.course_instructor) {
      return (
        <div className="flex items-center gap-2 text-sm text-secondary mb-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-medium">
            {review.course_instructor.course?.code || "Unknown Course"}
          </span>
          <span>•</span>
          <span>{review.course_instructor.course?.name || "Course Name"}</span>
          <span>•</span>
          <GraduationCap className="w-4 h-4 text-primary" />
          <span>
            {review.course_instructor.professor?.name || "Unknown Professor"}
          </span>
        </div>
      );
    } else {
      // Fallback when we don't have course/professor data
      return (
        <div className="flex items-center gap-2 text-sm text-secondary mb-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-medium text-muted">Review</span>
          <span>•</span>
          <span className="text-muted">Course/Professor data loading...</span>
        </div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Subject Information */}
      {renderSubject()}

      {/* Review Header */}
      <div className="flex items-start gap-3 mb-4">
        <UserAvatar
          username={review.user?.username || "Unknown"}
          echoes={review.user?.echoes || 0}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {review.user?.username || "Unknown"}
              </span>
              <span className="text-xs text-secondary">
                {formatRelativeTime(review.created_at || review.createdAt)}
              </span>
            </div>

            {/* Follow Button - only show if not current user */}
            {review.user?.id &&
              currentUserId &&
              review.user.id !== currentUserId &&
              onFollowChange && (
                <FollowButton
                  userId={review.user.id}
                  isFollowing={review.user.isFollowing || false}
                  onFollowChange={(isFollowing) => {
                    console.log("FeedReviewCard follow change", {
                      userId: review.user!.id,
                      isFollowing,
                    });
                    onFollowChange(review.user!.id, isFollowing);
                  }}
                  className="text-xs px-2 py-1"
                />
              )}

            {/* Debug info - move to useEffect later */}
            {(() => {
              console.log("Follow button conditions:", {
                hasUserId: !!review.user?.id,
                hasCurrentUserId: !!currentUserId,
                isDifferentUser: review.user?.id !== currentUserId,
                hasFollowHandler: !!onFollowChange,
                isFollowing: review.user?.isFollowing,
              });
              return null;
            })()}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-600"
                }`}
              />
            ))}
            <span className="text-sm text-secondary ml-1">
              ({review.rating}/5)
            </span>
          </div>
        </div>
      </div>

      {/* Review Content */}
      {review.content && (
        <div className="mb-4 text-sm leading-relaxed">{review.content}</div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-3 border-t border-primary/10">
        {showVoteButtons && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote("up");
              }}
              disabled={isVoting}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                review.user_vote?.vote_type === true
                  ? "bg-green-500/20 text-green-400"
                  : "text-secondary hover:text-green-400 hover:bg-green-500/10"
              } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">{review.upvotes}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVote("down");
              }}
              disabled={isVoting}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                review.user_vote?.vote_type === false
                  ? "bg-red-500/20 text-red-400"
                  : "text-secondary hover:text-red-400 hover:bg-red-500/10"
              } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="text-sm">{review.downvotes}</span>
            </button>
          </>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReply();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 transition-all duration-200"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Reply</span>
        </button>
      </div>
    </motion.div>
  );
}
