"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Edit, Trash2, Flag, Star, BookOpen, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user/UserAvatar";
import { UserHoverCard } from "@/components/user/UserHoverCard";
import { RankBadge } from "@/components/user/RankBadge";
import { VoteButtons } from "./VoteButtons";
import { ReportModal } from "@/components/common/ReportModal";
import { formatDate } from "@/lib/utils";
import { FrontendReview } from "@/types/frontend-models";
import { MentionTextWithHover } from "@/components/common/MentionTextWithHover";
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
  // console.log("Rendering ReviewCard for:", review);
  const router = useRouter();
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
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to update review");
    }
  };

  const handleCourseClick = (courseCode: string) => {
    router.push(`/courses/${courseCode}`);
  };

  const handleProfessorClick = (professorId: string) => {
    router.push(`/professors/${professorId}`);
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
            >
              <UserAvatar
                username={review.author.username}
                echoes={review.author.echoes}
                size="sm"
                />
            </UserHoverCard>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserHoverCard
                  username={review.author.username}
                  echoes={review.author.echoes}
                  isVerified={review.author.isVerified}
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

          {(review.course_instructors && review.course_instructors.length > 0 || review.professor || review.course) && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Course Instructor Tags (Time Period and Professor) */}
              {review.course_instructors && review.course_instructors.map((ci, index) => (
                <span key={index} className="bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded-full border border-green-500/30 flex items-center gap-1">
                  {ci.semester && ci.year
                    ? `${ci.semester} '${ci.year.toString().slice(-2)}`
                    : ci.semester || ci.year}
                  {ci.professor && (
                    <button
                      onClick={() => ci.professor?.id && handleProfessorClick(ci.professor.id)}
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      ({ci.professor.name || 'Unknown'})
                    </button>
                  )}
                </span>
              ))}

              {/* Professor Tags (clickable) */}
              {review.professor && (
                <button
                  onClick={() => review.professor?.id && handleProfessorClick(review.professor.id)}
                  className="bg-blue-500/20 text-blue-400 px-2 py-1 text-xs rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <GraduationCap className="w-3 h-3" />
                  {review.professor.name}
                </button>
              )}

              {/* Course Tag (for professor page showing which course was reviewed) - clickable */}
              {review.course && (
                <button
                  onClick={() => review.course?.code && handleCourseClick(review.course.code)}
                  className="bg-orange-500/20 text-orange-400 px-2 py-1 text-xs rounded-full border border-orange-500/30 hover:bg-orange-500/30 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  {review.course.code}
                </button>
              )}

              
            </div>
          )}

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
              <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                {review.content ? <MentionTextWithHover content={review.content} /> : null}
              </div>
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
                className="px-4 py-2 bg-red-500/10 text-red-500 font-medium rounded-lg hover:bg-red-500 hover:text-white transition-colors"
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
