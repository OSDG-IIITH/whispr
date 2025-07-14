"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  BookOpen,
  GraduationCap,
  Edit2,
  Trash2,
  Flag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FrontendReview } from "@/types/frontend-models";
import { UserAvatar } from "@/components/user/UserAvatar";
import { UserHoverCard } from "@/components/user/UserHoverCard";
import { RankBadge } from "@/components/user/RankBadge";
import { VoteButtons } from "./VoteButtons";
import { ReviewForm } from "./ReviewForm";
import { ReportModal } from "@/components/common/ReportModal";
import { formatDate } from "@/lib/utils";
import { MentionTextWithHover } from "@/components/common/MentionTextWithHover";
import { useToast } from "@/providers/ToastProvider";

interface FeedReviewCardProps {
  review: FrontendReview;
  onVote: (reviewId: string, type: "up" | "down") => Promise<void>;
  onReply: (reviewId: string) => Promise<void>;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
  currentUserId?: string;
  showVoteButtons?: boolean;
  onEdit?: (
    reviewId: string,
    data: { content: string; rating: number }
  ) => Promise<void>;
  onDelete?: (reviewId: string) => Promise<void>;
  onReport?: (
    reviewId: string,
    reportType: string,
    reason: string
  ) => Promise<void>;
}

export function FeedReviewCard({
  review,
  onVote,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
}: FeedReviewCardProps) {
  const router = useRouter();
  const { showError } = useToast();
  const [showActions, setShowActions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUserId && review.user?.id === currentUserId;

  const handleVote = (type: "up" | "down") => {
    onVote(review.id, type);
  };

  const handleReport = async (reportType: string, reason: string) => {
    if (onReport) {
      await onReport(review.id, reportType, reason);
    }
  };

  const handleEditSubmit = async (data: {
    content: string;
    rating: number;
  }) => {
    if (!onEdit) return;
    try {
      await onEdit(review.id, data);
      setIsEditing(false);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to update review");
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(review.id);
      setShowDeleteConfirm(false);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to delete review");
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or in edit mode
    if (isEditing || (e.target as HTMLElement).closest("button")) {
      return;
    }

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
      console.warn("Cannot navigate: missing course/professor data", review);
    }
  };

  const renderSubject = () => {
    if (review.course_id && review.course) {
      return (
        <div className="flex items-center gap-2 text-sm text-secondary mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>{review.course.name}</span>
          <span>•</span>
          <span className="font-medium">{review.course.code}</span>
        </div>
      );
    } else if (review.professor_id && review.professor) {
      return (
        <div className="flex items-center gap-2 text-sm text-secondary mb-3">
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
        <div className="flex items-center gap-2 text-sm text-secondary mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-medium">
            {review.course_instructor.course?.code || "Unknown Course"}
          </span>
          <span>•</span>
          <span>
            {review.course_instructor.course?.name || "Unknown Course Name"}
          </span>
          <span>•</span>
          <GraduationCap className="w-4 h-4 text-primary" />
          <span>
            {review.course_instructor.professor?.name || "Unknown Professor"}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-sm text-secondary mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-medium text-muted">Review</span>
          <span>•</span>
          <span className="text-muted">Course/Professor data loading...</span>
        </div>
      );
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-500 fill-current" : "text-secondary"
        }`}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer"
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Edit Form */}
      {isEditing && (
        <div onClick={(e) => e.stopPropagation()} className="mb-4">
          <ReviewForm
            initialContent={review.content}
            initialRating={review.rating}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
            placeholder="Share your honest thoughts about this course/professor..."
            submitText="Update Review"
            title="Edit Review"
          />
        </div>
      )}

      {!isEditing && (
        <>
          {/* Subject Information */}
          {renderSubject()}

          <div className="flex gap-3">
            {/* Vote Buttons */}
            <div className="flex-shrink-0">
              <VoteButtons
                upvotes={review.upvotes}
                downvotes={review.downvotes}
                userVote={review.userVote}
                onVote={handleVote}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <UserHoverCard
                  username={
                    review.author?.username ||
                    review.user?.username ||
                    "Unknown"
                  }
                  echoes={review.author?.echoes || review.user?.echoes || 0}
                  isVerified={
                    review.author?.isVerified ||
                    review.user?.isVerified ||
                    false
                  }
                >
                  <UserAvatar
                    username={
                      review.author?.username ||
                      review.user?.username ||
                      "Unknown"
                    }
                    echoes={review.author?.echoes || review.user?.echoes || 0}
                    size="sm"
                  />
                </UserHoverCard>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <UserHoverCard
                      username={
                        review.author?.username ||
                        review.user?.username ||
                        "Unknown"
                      }
                      echoes={review.author?.echoes || review.user?.echoes || 0}
                      isVerified={
                        review.author?.isVerified ||
                        review.user?.isVerified ||
                        false
                      }
                    >
                      <span className="font-medium text-sm hover:text-primary transition-colors cursor-pointer">
                        {review.author?.username ||
                          review.user?.username ||
                          "Unknown"}
                      </span>
                    </UserHoverCard>
                    <RankBadge
                      echoes={review.author?.echoes || review.user?.echoes || 0}
                      size="sm"
                      showIcon={false}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span>
                      {formatDate(
                        review.createdAt || review.created_at || new Date()
                      )}
                    </span>
                    {review.isEdited && <span>(edited)</span>}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {showActions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isOwner && onEdit && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit review"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {isOwner && onDelete && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {!isOwner && onReport && (
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="p-1.5 text-secondary hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                          title="Report review"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-invert prose-sm max-w-none mb-3">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {review.content ? (
                    <MentionTextWithHover content={review.content} />
                  ) : null}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        targetType="review"
        targetId={review.id}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Review</h3>
            <p className="text-secondary mb-6">
              Are you sure you want to delete this review? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
