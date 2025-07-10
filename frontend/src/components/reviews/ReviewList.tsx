"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReviewCard } from "./ReviewCard";
import { LoadingBubble } from "@/components/common/LoadingBubble";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

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

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onVote: (reviewId: string, type: "up" | "down") => void;
  onReply: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  emptyMessage?: string;
}

export function ReviewList({
  reviews,
  loading = false,
  hasMore = false,
  onLoadMore,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onReport,
  emptyMessage = "No reviews yet. Be the first to share your experience!"
}: ReviewListProps) {
  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    onLoadMore: onLoadMore || (() => { }),
    loading
  });

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-12 h-20 bg-muted rounded-lg animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-16 h-4 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-muted rounded animate-pulse" />
                  <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-1/2 h-4 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-4 bg-muted rounded animate-pulse" />
                  <div className="w-16 h-4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">💭</span>
        </div>
        <p className="text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <ReviewCard
              review={review}
              onVote={onVote}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-4">
          {loading && (
            <div className="flex justify-center">
              <LoadingBubble message="Loading more reviews..." />
            </div>
          )}
        </div>
      )}
    </div>
  );
}