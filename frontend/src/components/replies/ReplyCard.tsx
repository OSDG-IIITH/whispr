"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Edit, Trash2, Flag } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import { UserHoverCard } from "@/components/user/UserHoverCard";
import { RankBadge } from "@/components/user/RankBadge";
import { VoteButtons } from "@/components/reviews/VoteButtons";
import { ReportModal } from "@/components/common/ReportModal";
import { formatDate } from "@/lib/utils";
import { FrontendReply } from "@/types/frontend-models";

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
  const [showActions, setShowActions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleVote = (type: "up" | "down") => {
    onVote(reply.id, type);
  };

  const handleReport = async (reportType: string, reason: string) => {
    if (onReport) {
      await onReport(reply.id, reportType, reason);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-muted/30 border border-border rounded-lg p-4 ml-12 hover:border-primary/30 transition-colors"
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
              avatarUrl={reply.author.avatarUrl}
            >
              <UserAvatar
                username={reply.author.username}
                echoes={reply.author.echoes}
                size="sm"
                avatarUrl={reply.author.avatarUrl}
              />
            </UserHoverCard>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <UserHoverCard
                  username={reply.author.username}
                  echoes={reply.author.echoes}
                  isVerified={reply.author.isVerified}
                  avatarUrl={reply.author.avatarUrl}
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

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showActions ? 1 : 0 }}
              className="flex items-center gap-1"
            >
              {reply.isOwn ? (
                <>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(reply.id, reply.content)}
                      className="p-1.5 text-secondary hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Edit reply"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(reply.id)}
                      className="p-1.5 text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete reply"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
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
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
              {reply.content}
            </p>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        targetType="reply"
        targetId={reply.id}
      />
    </motion.div>
  );
}
