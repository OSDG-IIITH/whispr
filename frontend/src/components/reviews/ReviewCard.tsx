"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Edit, Trash2, Flag, Star } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import { UserHoverCard } from "@/components/user/UserHoverCard";
import { RankBadge } from "@/components/user/RankBadge";
import { VoteButtons } from "./VoteButtons";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  author: {
    username: string;
    echoes: number;
    isVerified: boolean;
    avatarUrl?: string;
  };
  content: string;
  rating: number;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: string;
  isEdited: boolean;
  userVote?: "up" | "down" | null;
  isOwn?: boolean;
}

interface ReviewCardProps {
  review: Review;
  onVote: (reviewId: string, type: "up" | "down") => void;
  onReply: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  showReplies?: boolean;
}

export function ReviewCard({ 
  review, 
  onVote, 
  onReply, 
  onEdit, 
  onDelete, 
  onReport,
  showReplies = true 
}: ReviewCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleVote = (type: "up" | "down") => {
    onVote(review.id, type);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-secondary'
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
                <RankBadge echoes={review.author.echoes} size="sm" showIcon={false} />
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

          {/* Content */}
          <div className="prose prose-invert prose-sm max-w-none mb-3">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {review.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showReplies && (
                <button
                  onClick={() => onReply(review.id)}
                  className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{review.replyCount} replies</span>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showActions ? 1 : 0 }}
              className="flex items-center gap-2"
            >
              {review.isOwn ? (
                <>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(review.id)}
                      className="p-1.5 text-secondary hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Edit review"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(review.id)}
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
                    onClick={() => onReport(review.id)}
                    className="p-1.5 text-secondary hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                    title="Report review"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}