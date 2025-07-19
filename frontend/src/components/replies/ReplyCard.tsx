"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, Flag } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import { UserHoverCard } from "@/components/user/UserHoverCard";
import { RankBadge } from "@/components/user/RankBadge";
import { VoteButtons } from "@/components/reviews/VoteButtons";
import { ReportModal } from "@/components/common/ReportModal";
import { formatDate } from "@/lib/utils";
import { FrontendReply } from "@/types/frontend-models";
import { MentionTextWithHover } from "@/components/common/MentionTextWithHover";
import { ReplyForm } from "./ReplyForm";
import { useToast } from "@/providers/ToastProvider";

interface ReplyCardProps {
  reply: FrontendReply;
  onVote: (replyId: string, type: "up" | "down") => Promise<void> | void;
  onEdit?: (replyId: string, content: string) => Promise<void> | void;
  onDelete?: (replyId: string) => Promise<void> | void;
  onReport?: (
    replyId: string,
    reportType: string,
    reason: string
  ) => Promise<void> | void;
}

export function ReplyCard({
  reply,
  onVote,
  onEdit,
  onDelete,
  onReport,
}: ReplyCardProps) {
  const { showError } = useToast();
  const [showActions, setShowActions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleVote = (type: "up" | "down") => {
    onVote(reply.id, type);
  };

  const handleReport = async (reportType: string, reason: string) => {
    if (onReport) {
      await onReport(reply.id, reportType, reason);
    }
  };

  // Inline edit submit handler
  const handleEditSubmit = async (content: string) => {
    if (!onEdit) return;
    try {
      await onEdit(reply.id, content);
      setIsEditing(false);
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Failed to update reply");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-muted/30 border border-border rounded-lg p-2 sm:p-4 ml-12 hover:border-primary/30 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Vote Buttons */}
        <div className="flex-shrink-0">
          <VoteButtons
            upvotes={reply.upvotes}
            downvotes={reply.downvotes}
            userVote={reply.userVote}
            onVote={handleVote}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <UserHoverCard
              username={reply.author.username}
              echoes={reply.author.echoes}
              isVerified={reply.author.isVerified}
            >
              <UserAvatar
                username={reply.author.username}
                echoes={reply.author.echoes}
                size="sm"
              />
            </UserHoverCard>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserHoverCard
                  username={reply.author.username}
                  echoes={reply.author.echoes}
                  isVerified={reply.author.isVerified}
                >
                  <span className="font-medium text-sm hover:text-primary transition-colors cursor-pointer">
                    {reply.author.username}
                  </span>
                </UserHoverCard>
                <RankBadge
                  echoes={reply.author.echoes}
                  size="sm"
                  showIcon={false}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <span>{formatDate(reply.createdAt)}</span>
                {reply.isEdited && <span>(edited)</span>}
              </div>
            </div>
          </div>

          {/* Content or Edit Form */}
          <div className="prose prose-invert prose-sm max-w-none">
            {isEditing ? (
              <ReplyForm
                initialContent={reply.content}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
                <MentionTextWithHover content={reply.content} />
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showActions ? 1 : 0 }}
            className="flex flex-col items-end gap-1"
          >
            {reply.isOwn ? (
              <>
                <div className="flex justify-end gap-1 mt-auto pt-2">
                  {onEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-secondary hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Edit reply"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1.5 text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete reply"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              onReport && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-1.5 text-secondary hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                  title="Report reply"
                >
                  <Flag className="w-3 h-3" />
                </button>
              )
            )}
          </motion.div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        targetType="reply"
        targetId={reply.id}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-4">Delete Reply</h3>
            <p className="mb-6 text-secondary">
              Are you sure you want to delete this reply? This action cannot be
              undone.
            </p>
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
                  await onDelete?.(reply.id);
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
