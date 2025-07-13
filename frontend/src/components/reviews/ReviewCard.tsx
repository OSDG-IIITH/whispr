"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Edit, Trash2, Flag, Star } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import { UserHoverCard } from "@/components/user/UserHoverCard";
import { RankBadge } from "@/components/user/RankBadge";
import { VoteButtons } from "./VoteButtons";
import { ReportModal } from "@/components/common/ReportModal";
import { formatDate } from "@/lib/utils";
import { FrontendReview } from "@/types/frontend-models";
import { MentionText } from "@/components/common/MentionText";
import { ReviewForm } from "./ReviewForm";
import { useToast } from "@/providers/ToastProvider";

interface ReviewCardProps {
  review: FrontendReview;
  onVote: (reviewId: string, type: "up" | "down") => Promise<void> | void;
  onReply: (reviewId: string) => Promise<void> | void;
  onEdit?: (reviewId: string, data: { content: string; rating: number }) => Promise<void> | void;
  onDelete?: (reviewId: string) => Promise<void> | void;
  onReport?: (
    reviewId: string,
    reportType: string,
    reason: string
  ) => Promise<void> | void;
  showReplies?: boolean;
}

export function ReviewCard({
  review,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onReport,
  showReplies = true,
}: ReviewCardProps) {
  const { showError } = useToast();
  const [showActions, setShowActions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleVote = (type: "up" | "down") => {
    onVote(review.id, type);
  };

  const handleReport = async (reportType: string, reason: string) => {
    if (onReport) {
      await onReport(review.id, reportType, reason);
    }
  };

  // Inline edit submit handler
  const handleEditSubmit = async (data: { content: string; rating: number }) => {
    if (!onEdit) return;
    try {
      await onEdit(review.id, data);
      setIsEditing(false);
    } catch (e: any) {
      showError(e?.message || "Failed to update review");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-current" : "text-secondary"
          }`}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
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
              username={review.author.username}
              echoes={review.author.echoes}
              isVerified={review.author.isVerified}
              avatarUrl={review.author.avatarUrl}
            >
              <UserAvatar
                username={review.author.username}
                echoes={review.author.echoes}
                size="sm"
                avatarUrl={review.author.avatarUrl}
              />
            </UserHoverCard>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserHoverCard
                  username={review.author.username}
                  echoes={review.author.echoes}
                  isVerified={review.author.isVerified}
                  avatarUrl={review.author.avatarUrl}
                >
                  <span className="font-medium text-sm hover:text-primary transition-colors cursor-pointer">
                    {review.author.username}
                  </span>
                </UserHoverCard>
                <RankBadge
                  echoes={review.author.echoes}
                  size="sm"
                  showIcon={false}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <span>{formatDate(review.createdAt)}</span>
                {review.isEdited && <span>(edited)</span>}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              {renderStars(review.rating)}
            </div>
          </div>

          {/* Content or Edit Form */}
          <div className="prose prose-invert prose-sm max-w-none mb-3">
            {isEditing ? (
              <ReviewForm
                initialContent={review.content}
                initialRating={review.rating}
                submitText="Save Changes"
                title="Edit Review"
                placeholder="Edit your review..."
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {review.content ? <MentionText content={review.content} /> : null}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showReplies && !isEditing && (
                <button
                  onClick={() => onReply(review.id)}
                  className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    Reply{review.replyCount > 0 ? ` (${review.replyCount})` : ""}
                  </span>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showActions ? 1 : 0 }}
                className="flex items-center gap-2"
              >
                {review.isOwn ? (
                  <>
                    {onEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-secondary hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Edit review"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-1.5 text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  onReport && (
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="p-1.5 text-secondary hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                      title="Report review"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

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
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-4">Delete Review</h3>
            <p className="mb-6 text-secondary">Are you sure you want to delete this review? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-secondary hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await onDelete?.(review.id);
                }}
                className="btn btn-danger px-6 py-2"
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
