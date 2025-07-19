"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserHoverCard } from "@/components/user/UserHoverCard";
import { userAPI } from "@/lib/api";
import type { User } from "@/types/backend-models";

interface MentionLinkProps {
  username: string;
}

export function MentionLink({ username }: MentionLinkProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (loading || user || error) return;

      setLoading(true);
      try {
        const userData = await userAPI.getUserByUsername(username);
        setUser(userData);
      } catch (err) {
        console.error(`Failed to fetch user data for @${username}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username, loading, user, error]);

  const handleClick = () => {
    router.push(`/profile/${username}`);
  };

  // If we have user data, show with hover card
  if (user) {
    return (
      <UserHoverCard
        username={user.username}
        echoes={user.echoes}
        isVerified={!(user.is_muffled && !user.is_banned)}
        joinDate={user.created_at}
        reviewCount={0} // TODO: Add review count to user data
      >
        <span
          className="text-primary font-medium hover:underline cursor-pointer"
          onClick={handleClick}
        >
          @{username}
        </span>
      </UserHoverCard>
    );
  }

  // If user doesn't exist or error, show plain mention
  if (error) {
    return <span className="text-secondary font-medium">@{username}</span>;
  }

  // Loading or plain mention
  return (
    <span
      className="text-primary font-medium hover:underline cursor-pointer"
      onClick={handleClick}
    >
      @{username}
    </span>
  );
}
