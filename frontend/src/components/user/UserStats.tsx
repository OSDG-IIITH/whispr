"use client";

import { useState, useEffect } from "react";
import { Users, Heart } from "lucide-react";
import { userAPI } from "@/lib/api";
import { User } from "@/types/backend-models";
import { FollowListModal } from "./FollowListModal";

interface UserStatsProps {
  user: User;
  isOwnProfile?: boolean;
}

export function UserStats({ user, isOwnProfile = false }: UserStatsProps) {
  const [followData, setFollowData] = useState({
    followers_count: 0,
    following_count: 0,
    is_following: false,
    is_followed_by: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<
    "followers" | "following" | null
  >(null);

  useEffect(() => {
    fetchFollowData();
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFollowData = async () => {
    try {
      const data = await userAPI.getFollowStatus(user.id);
      setFollowData(data);
    } catch (error) {
      console.error("Failed to fetch follow data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {/* Followers */}
        <button
          onClick={() => setActiveModal("followers")}
          className="bg-primary/10 rounded-lg p-4 text-center hover:bg-primary/20 transition-colors"
        >
          <Users className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">
            {loading ? "..." : followData.followers_count}
          </div>
          <div className="text-sm text-secondary">Followers</div>
        </button>

        {/* Following */}
        <button
          onClick={() => setActiveModal("following")}
          className="bg-primary/10 rounded-lg p-4 text-center hover:bg-primary/20 transition-colors"
        >
          <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">
            {loading ? "..." : followData.following_count}
          </div>
          <div className="text-sm text-secondary">Following</div>
        </button>
      </div>

      {/* Follow status indicators (if not own profile) */}
      {!isOwnProfile && !loading && (
        <div className="mt-4 space-y-2">
          {followData.is_following && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Heart className="w-4 h-4 fill-current" />
              <span>You follow this user</span>
            </div>
          )}
          {followData.is_followed_by && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Users className="w-4 h-4" />
              <span>Follows you</span>
            </div>
          )}
        </div>
      )}

      {/* Follow List Modals */}
      <FollowListModal
        isOpen={activeModal === "followers"}
        onClose={handleModalClose}
        userId={user.id}
        type="followers"
        title={`${user.username}'s Followers`}
      />
      <FollowListModal
        isOpen={activeModal === "following"}
        onClose={handleModalClose}
        userId={user.id}
        type="following"
        title={`${user.username} Following`}
      />
    </>
  );
}
