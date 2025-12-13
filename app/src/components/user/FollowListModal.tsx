"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Heart, X } from "lucide-react";
import { userAPI } from "@/lib/api";
import { User } from "@/types/backend-models";
import { UserAvatar } from "./UserAvatar";
import { FollowButton } from "./FollowButton";
import { useAuth } from "@/providers/AuthProvider";
import Loader from "@/components/common/Loader";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
  title: string;
}

export function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
  title,
}: FollowListModalProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, userId, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedUsers =
        type === "followers"
          ? await userAPI.getFollowers(userId)
          : await userAPI.getFollowing(userId);

      setUsers(fetchedUsers);

      // Initialize follow states for current user
      if (currentUser) {
        const states: Record<string, boolean> = {};
        for (const user of fetchedUsers) {
          if (user.id !== currentUser.id) {
            try {
              const status = await userAPI.getFollowStatus(user.id);
              states[user.id] = status.is_following;
            } catch (err) {
              console.error(
                "Failed to get follow status for user:",
                user.id,
                err
              );
              states[user.id] = false;
            }
          }
        }
        setFollowStates(states);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setFollowStates((prev) => ({
      ...prev,
      [targetUserId]: isFollowing,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-primary/20 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            {type === "followers" ? (
              <Users className="w-5 h-5 text-primary" />
            ) : (
              <Heart className="w-5 h-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader />
            </div>
          ) : error ? (
            <div className="text-center p-8 text-red-400">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center p-8 text-secondary">No {type} yet</div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors"
                >
                  <UserAvatar
                    username={user.username}
                    echoes={user.echoes}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-secondary">
                      {user.echoes} echoes
                    </div>
                  </div>
                  {currentUser &&
                    currentUser.id !== user.id &&
                    !currentUser.is_muffled && (
                      <FollowButton
                        userId={user.id}
                        isFollowing={followStates[user.id] || false}
                        onFollowChange={(isFollowing) =>
                          handleFollowChange(user.id, isFollowing)
                        }
                        className="text-xs px-3 py-1"
                      />
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
