"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { ReplyCard } from "./ReplyCard";
import { ReplyForm } from "./ReplyForm";
import { FrontendReply } from "@/types/frontend-models";

interface ReplyListProps {
  replies: FrontendReply[];
  reviewId: string;
  onVote: (replyId: string, type: "up" | "down") => Promise<void> | void;
  onSubmitReply: (reviewId: string, content: string) => Promise<void> | void;
  onEdit?: (replyId: string, content: string) => Promise<void> | void;
  onDelete?: (replyId: string) => Promise<void> | void;
  onReport?: (
    replyId: string,
    reportType?: string,
    reason?: string
  ) => Promise<void> | void;
  collapsed?: boolean;
}

export function ReplyList({
  replies,
  reviewId,
  onVote,
  onSubmitReply,
  onEdit,
  onDelete,
  onReport,
  collapsed = false,
}: ReplyListProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleSubmitReply = async (content: string) => {
    await onSubmitReply(reviewId, content);
    setShowReplyForm(false);
  };

  if (replies.length === 0 && !showReplyForm) {
    return (
      <div className="ml-12 mt-3">
        <button
          onClick={() => setShowReplyForm(true)}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Be the first to reply</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {replies.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-3 ml-12"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span>
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </span>
        </button>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {replies.map((reply, index) => (
              <motion.div
                key={reply.id}
                id={`reply-${reply.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={reply.isHighlighted ? "animate-pulse" : ""}
              >
                <div
                  className={`transition-all duration-300 ${
                    reply.isHighlighted
                      ? "ring-2 ring-primary ring-opacity-50 bg-primary/5 rounded-xl p-2"
                      : ""
                  }`}
                >
                  <ReplyCard
                    reply={reply}
                    onVote={onVote}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReport={onReport}
                  />
                </div>
              </motion.div>
            ))}

            {showReplyForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ReplyForm
                  onSubmit={handleSubmitReply}
                  onCancel={() => setShowReplyForm(false)}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
