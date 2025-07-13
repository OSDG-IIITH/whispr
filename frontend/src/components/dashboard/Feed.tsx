"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { feedAPI, reviewAPI, voteAPI, userAPI } from "@/lib/api";
import {
  FrontendReview,
  convertReviewToFrontendReview,
} from "@/types/frontend-models";
import { useAuth } from "@/providers/AuthProvider";
import { FeedReviewCard } from "@/components/reviews/FeedReviewCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Loader from "@/components/common/Loader";

export function Feed() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<FrontendReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const funLoadingMessages = [
    "Brewing fresh reviews...",
    "Stirring the academic pot...",
    "Whispering secrets of wisdom...",
    "Conjuring course chronicles...",
    "Mixing professor potions...",
    "Echoing student voices...",
    "Spinning scholarly stories...",
    "Weaving wisdom webs...",
    "Distilling digital discussions...",
    "Crafting curious chronicles...",
  ];

  const [loadingMessage, setLoadingMessage] = useState(
    funLoadingMessages[Math.floor(Math.random() * funLoadingMessages.length)]
  );

  const fetchFollowingList = async () => {
    if (!user?.id) return;

    try {
      const following = await userAPI.getFollowing(user.id, 0, 1000); // Get up to 1000 following
      setFollowingIds(new Set(following.map((u) => u.id)));
    } catch (error) {
      console.error("Failed to fetch following list:", error);
    }
  };

  const fetchFeed = async (skipCount = 0, isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
        setLoadingMessage(
          funLoadingMessages[
            Math.floor(Math.random() * funLoadingMessages.length)
          ]
        );
      }

      const backendReviews = await feedAPI.getFeed(skipCount, 20);

      // Convert backend reviews to frontend format
      const frontendReviews = backendReviews.map((review) => {
        const convertedReview = convertReviewToFrontendReview(
          review,
          null,
          user?.id
        );

        // Set follow status based on followingIds
        if (convertedReview.user?.id) {
          const isFollowing = followingIds.has(convertedReview.user.id);
          convertedReview.user = {
            ...convertedReview.user,
            isFollowing: isFollowing,
          };
        }

        return convertedReview;
      });

      if (isRefresh) {
        setReviews(frontendReviews);
        setSkip(20);
      } else {
        setReviews((prev) => [...prev, ...frontendReviews]);
        setSkip((prev) => prev + 20);
      }

      setHasMore(frontendReviews.length === 20);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      setError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchFeed(0, true);
  };

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      setLoading(true);
      await fetchFeed(skip, false);
    }
  };

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    if (!user) return;

    try {
      // Find the review and current vote
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) return;

      const currentVote = review.user_vote;
      const voteType = type === "up";

      // If user already voted the same way, remove the vote
      if (currentVote && currentVote.vote_type === voteType) {
        await voteAPI.deleteVote(currentVote.id);

        // Update local state
        setReviews((prev) =>
          prev.map((r) => {
            if (r.id === reviewId) {
              return {
                ...r,
                upvotes: voteType ? r.upvotes - 1 : r.upvotes,
                downvotes: voteType ? r.downvotes : r.downvotes - 1,
                user_vote: undefined,
                userVote: null,
              };
            }
            return r;
          })
        );
      } else {
        // Create new vote or update existing
        const newVote = await voteAPI.createVote({
          review_id: reviewId,
          vote_type: voteType,
        });

        // Update local state
        setReviews((prev) =>
          prev.map((r) => {
            if (r.id === reviewId) {
              const upvoteChange = voteType
                ? 1
                : currentVote?.vote_type === true
                ? -1
                : 0;
              const downvoteChange = !voteType
                ? 1
                : currentVote?.vote_type === false
                ? -1
                : 0;

              return {
                ...r,
                upvotes: r.upvotes + upvoteChange,
                downvotes: r.downvotes + downvoteChange,
                user_vote: newVote,
                userVote: type,
              };
            }
            return r;
          })
        );
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleFollowChange = async (userId: string, isFollowing: boolean) => {
    console.log("handleFollowChange called", {
      userId,
      isFollowing,
      user: user?.id,
    });

    if (!user) return;

    try {
      // Update followingIds set
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        console.log("Updated followingIds", newSet);
        return newSet;
      });

      // Update local state optimistically
      setReviews((prev) =>
        prev.map((review) => {
          if (review.user?.id === userId) {
            return {
              ...review,
              user: review.user
                ? {
                    ...review.user,
                    isFollowing: isFollowing,
                  }
                : review.user,
            };
          }
          return review;
        })
      );
    } catch (error) {
      console.error("Failed to update follow status in feed:", error);

      // Revert optimistic updates on error
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });

      setReviews((prev) =>
        prev.map((review) => {
          if (review.user?.id === userId) {
            return {
              ...review,
              user: review.user
                ? {
                    ...review.user,
                    isFollowing: !isFollowing,
                  }
                : review.user,
            };
          }
          return review;
        })
      );
    }
  };

  const handleReply = async (reviewId: string) => {
    // For now, just log - this could open a reply modal
    console.log("Reply to review:", reviewId);
  };

  useEffect(() => {
    const initializeFeed = async () => {
      if (user?.id) {
        await fetchFollowingList();
      }
      await fetchFeed();
    };

    initializeFeed();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    onLoadMore: handleLoadMore,
    loading,
  });

  if (loading && reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader className="w-8 h-8" />
        <p className="text-primary font-medium animate-pulse">
          {loadingMessage}
        </p>
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button
          onClick={handleRefresh}
          className="btn btn-primary"
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Try Again"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Your Feed</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          <span className="text-sm">
            {refreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* Feed Content */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-secondary text-lg">
            No reviews in your feed yet
          </div>
          <p className="text-sm text-secondary">
            Follow some users or browse courses to see reviews here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <FeedReviewCard
              key={review.id}
              review={review}
              onVote={handleVote}
              onReply={handleReply}
              onFollowChange={handleFollowChange}
              currentUserId={user?.id}
              showVoteButtons={!!user && !user.is_muffled}
            />
          ))}
        </div>
      )}

      {/* Load More Indicator */}
      {loading && reviews.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader className="w-6 h-6" />
          <p className="text-primary font-medium animate-pulse">
            {loadingMessage}
          </p>
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && reviews.length > 0 && (
        <div className="text-center py-8 text-secondary">
          <p>You&apos;ve reached the end of your feed!</p>
          <p className="text-sm mt-2">
            Time to explore more courses or find new users to follow
          </p>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <div ref={loadMoreRef} />
    </div>
  );
}
