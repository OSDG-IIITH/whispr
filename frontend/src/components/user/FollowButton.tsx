"use client";

import { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { userAPI } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

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
  const { user } = useAuth();
  const { showError } = useToast();

  const handleFollow = async (e: any) => {
    e.stopPropagation(); // Prevent card click when follow button is clicked

    console.log("Follow button clicked", {
      userId,
      isFollowing,
      loading,
      disabled,
    });

    if (loading || disabled) return;

    // Check if user is muffled
    if (user?.is_muffled) {
      showError("You need to verify your account to follow users.");
      return;
    }

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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isFollowing
        ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
        : "bg-primary/20 text-primary hover:bg-primary/30"
        } ${loading || disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {loading ? "..." : isFollowing ? "Following" : "Follow"}
      </span>
    </button>
  );
}
