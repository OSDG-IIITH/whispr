"use client";

import { motion } from "framer-motion";
import { Star, BookOpen, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { FrontendReview } from "@/types/frontend-models";
import { UserAvatar } from "@/components/user/UserAvatar";
import { UserHoverCard } from "@/components/user/UserHoverCard";
import { RankBadge } from "@/components/user/RankBadge";
import { VoteButtons } from "./VoteButtons";
import { formatDate } from "@/lib/utils";
import { MentionTextWithHover } from "@/components/common/MentionTextWithHover";

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

  const handleVote = (type: "up" | "down") => {
    onVote(review.id, type);
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
    >
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
                review.author?.username || review.user?.username || "Unknown"
              }
              echoes={review.author?.echoes || review.user?.echoes || 0}
              isVerified={
                review.author?.isVerified || review.user?.isVerified || false
              }
            >
              <UserAvatar
                username={
                  review.author?.username || review.user?.username || "Unknown"
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
    </motion.div>
  );
}
