"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Sparkles, Users } from "lucide-react";
import { feedAPI, voteAPI, userAPI, FeedResponse } from "@/lib/api";
import {
  FrontendReview,
  convertReviewToFrontendReview,
} from "@/types/frontend-models";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { FeedReviewCard } from "@/components/reviews/FeedReviewCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { reviewAPI } from "@/lib/api";
import Loader from "@/components/common/Loader";

export function Feed() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [reviews, setReviews] = useState<FrontendReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  
  // Two-phase feed state
  const [feedPhase, setFeedPhase] = useState<'following' | 'general'>('following');
  const [followingSkip, setFollowingSkip] = useState(0);
  const [generalSkip, setGeneralSkip] = useState(0);
  const [followingExhausted, setFollowingExhausted] = useState(false);
  const fetchingRef = useRef(false);

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
      const following = await userAPI.getFollowing(user.id, 0, 1000);
      setFollowingIds(new Set(following.map((u) => u.id)));
    } catch (error) {
      console.error("Failed to fetch following list:", error);
    }
  };

  const fetchFeed = useCallback(async (isRefresh = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
        setLoadingMessage(
          funLoadingMessages[Math.floor(Math.random() * funLoadingMessages.length)]
        );
      } else if (!loading) {
        setLoadingMore(true);
      }

      // Build request params based on current state
      const params: Parameters<typeof feedAPI.getFeed>[0] = {
        limit: 10,
        phase: isRefresh ? 'following' : feedPhase,
        following_exhausted: isRefresh ? false : followingExhausted,
      };

      if (isRefresh) {
        params.skip = 0;
        params.general_skip = 0;
      } else if (feedPhase === 'following') {
        params.skip = followingSkip;
      } else {
        params.general_skip = generalSkip;
      }

      const response: FeedResponse = await feedAPI.getFeed(params);
      const backendReviews = response.reviews;

      // Get all user votes for these reviews
      const userVotes = new Map();
      if (user?.id && backendReviews.length > 0) {
        try {
          const reviewIds = backendReviews.map((r) => r.id);
          const votes = await voteAPI.getVotes({ user_id: user.id });
          votes.forEach((vote) => {
            if (vote.review_id && reviewIds.includes(vote.review_id)) {
              userVotes.set(vote.review_id, vote);
            }
          });
        } catch (error) {
          console.log("Error fetching user votes:", error);
        }
      }

      // Convert backend reviews to frontend format
      const frontendReviews = backendReviews.map((review) => {
        const userVote = userVotes.get(review.id) || null;
        const convertedReview = convertReviewToFrontendReview(
          review,
          userVote,
          user?.id
        );

        // Mark if from following and set follow status
        if (convertedReview.user?.id) {
          const isFollowing = followingIds.has(convertedReview.user.id);
          convertedReview.user = {
            ...convertedReview.user,
            isFollowing: isFollowing,
          };
        }

        // Add marker for reviews from people you follow
        (convertedReview as FrontendReview & { isFromFollowing?: boolean }).isFromFollowing = 
          followingIds.has(review.user_id);

        return convertedReview;
      });

      // Update state based on response
      if (isRefresh) {
        setReviews(frontendReviews);
        setFeedPhase(response.phase);
        setFollowingExhausted(response.following_exhausted);
        setFollowingSkip(response.phase === 'following' ? 20 : 0);
        setGeneralSkip(response.general_skip);
      } else {
        setReviews((prev) => {
          const merged = [...prev, ...frontendReviews];
          const uniqueMap = new Map();
          for (const review of merged) {
            uniqueMap.set(review.id, review);
          }
          return Array.from(uniqueMap.values());
        });

        // Update phase and skip counters
        setFeedPhase(response.phase);
        setFollowingExhausted(response.following_exhausted);
        
        if (response.phase === 'following') {
          setFollowingSkip((prev) => prev + frontendReviews.length);
        } else {
          setGeneralSkip(response.general_skip);
        }
      }

      setHasMore(response.has_more);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      setError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, [feedPhase, followingSkip, generalSkip, followingExhausted, user?.id, followingIds, loading, funLoadingMessages]);

  const handleRefresh = async () => {
    // Reset all state
    setFeedPhase('following');
    setFollowingSkip(0);
    setGeneralSkip(0);
    setFollowingExhausted(false);
    setHasMore(true);
    await fetchFeed(true);
  };

  const handleLoadMore = useCallback(async () => {
    if (!loadingMore && hasMore && !loading) {
      await fetchFeed(false);
    }
  }, [loadingMore, hasMore, loading, fetchFeed]);

  const handleVote = async (reviewId: string, type: "up" | "down") => {
    if (!user) return;

    try {
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) return;

      const currentVote = review.user_vote;
      const voteType = type === "up";

      if (currentVote && currentVote.vote_type === voteType) {
        await voteAPI.deleteVote(currentVote.id);
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
        const newVote = await voteAPI.createVote({
          review_id: reviewId,
          vote_type: voteType,
        });

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
    if (!user) return;

    try {
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
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
                    isFollowing: isFollowing,
                  }
                : review.user,
            };
          }
          return review;
        })
      );
    } catch (error) {
      console.error("Failed to update follow status:", error);
      // Revert on error
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });
    }
  };

  const handleReply = async (reviewId: string) => {
    console.log("Reply to review:", reviewId);
  };

  const handleEdit = async (
    reviewId: string,
    data: { content: string; rating: number }
  ) => {
    if (!user) {
      showError("Please log in to edit");
      return;
    }

    try {
      await reviewAPI.updateReview(reviewId, data);
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                content: data.content,
                rating: data.rating,
                isEdited: true,
              }
            : review
        )
      );
      showSuccess("Review updated successfully!");
    } catch (error: unknown) {
      console.error("Failed to edit review:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to edit review. Please try again."
      );
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!user) {
      showError("Please log in to delete");
      return;
    }

    try {
      await reviewAPI.deleteReview(reviewId);
      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
      showSuccess("Review deleted successfully!");
    } catch (error: unknown) {
      console.error("Failed to delete review:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to delete review. Please try again."
      );
    }
  };

  const handleReport = async (
    reviewId: string,
    reportType: string,
    reason: string
  ) => {
    console.log(
      `Reporting review ${reviewId} with type ${reportType} and reason: ${reason}`
    );
  };

  useEffect(() => {
    const initializeFeed = async () => {
      if (user?.id) {
        await fetchFollowingList();
      }
      await fetchFeed(true);
    };

    initializeFeed();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    onLoadMore: handleLoadMore,
    loading: loading || loadingMore,
  });

  // Count reviews from following for section indicator
  const followingReviewsCount = reviews.filter(
    (r) => (r as FrontendReview & { isFromFollowing?: boolean }).isFromFollowing
  ).length;

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
          className="btn btn-primary w-24 h-8"
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
          {/* Following section indicator */}
          {followingReviewsCount > 0 && feedPhase === 'following' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg text-sm text-primary">
              <Users className="w-4 h-4" />
              <span>From people you follow</span>
            </div>
          )}

          {reviews.map((review, index) => {
            // Show transition indicator when switching to general reviews
            const isFromFollowing = (review as FrontendReview & { isFromFollowing?: boolean }).isFromFollowing;
            const prevReview = index > 0 ? reviews[index - 1] : null;
            const prevIsFromFollowing = prevReview 
              ? (prevReview as FrontendReview & { isFromFollowing?: boolean }).isFromFollowing 
              : true;
            const showTransition = !isFromFollowing && prevIsFromFollowing && followingReviewsCount > 0;

            return (
              <div key={review.id}>
                {showTransition && (
                  <div className="flex items-center gap-3 py-4 my-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-sm text-secondary px-3">
                      Discover more reviews
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <FeedReviewCard
                  review={review}
                  onVote={handleVote}
                  onReply={handleReply}
                  onFollowChange={handleFollowChange}
                  currentUserId={user?.id}
                  showVoteButtons={!!user && !user.is_muffled && !user.is_banned}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReport={handleReport}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Indicator */}
      {loadingMore && (
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
