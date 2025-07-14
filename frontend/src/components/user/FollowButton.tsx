"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { userAPI } from "@/lib/api";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function FollowButton({
  userId,
  isFollowing,
  onFollowChange,
  className = "",
  disabled = false,
}: FollowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when follow button is clicked

    console.log("Follow button clicked", {
      userId,
      isFollowing,
      loading,
      disabled,
    });

    if (loading || disabled) return;

    setLoading(true);
    try {
      if (isFollowing) {
        console.log("Unfollowing user:", userId);
        await userAPI.unfollowUser(userId);
        onFollowChange(false);
      } else {
        console.log("Following user:", userId);
        await userAPI.followUser(userId);
        onFollowChange(true);
      }
      console.log("Follow operation completed successfully");
    } catch (error) {
      console.error("Failed to update follow status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading || disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        isFollowing
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-primary/20 text-primary hover:bg-primary/30"
      } ${
        loading || disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {loading ? "..." : isFollowing ? "Unfollow" : "Follow"}
      </span>
    </button>
  );
}
