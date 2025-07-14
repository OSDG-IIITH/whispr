"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { getRank } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  echoes?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  avatarUrl?: string; // Deprecated - will be ignored in favor of generated avatar
}

export function UserAvatar({ username, echoes = 0, size = "md", className = "" }: UserAvatarProps) {
  const rank = getRank(echoes);

  // Generate DiceBear avatar URL
  const avatarUrl = useMemo(() => {
    return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(username)}`;
  }, [username]);

  // Generate fallback initials and color in case DiceBear fails
  const fallbackAvatar = useMemo(() => {
    // Simple hash function to generate consistent colors from username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate colors based on rank
    const hue = Math.abs(hash) % 360;
    const saturation = 60 + (Math.abs(hash) % 30); // 60-90%
    const lightness = 45 + (Math.abs(hash) % 20); // 45-65%

    // Use rank colors for higher ranks
    let backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    if (echoes >= 500) {
      backgroundColor = rank.color;
    }

    // Generate initials
    const initials = username
      .split('_')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return {
      backgroundColor,
      initials
    };
  }, [username, rank.color, echoes]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };

  return (
    <span className={`${sizeClasses[size]} relative ${className} inline-block`}>
      <Image
        src={avatarUrl}
        alt={`${username}'s avatar`}
        width={64}
        height={64}
        className="w-full h-full rounded-full object-cover shadow-lg"
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          // Fallback to generated avatar if DiceBear fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.classList.remove('hidden');
          }
        }}
        unoptimized
      />
      {/* Fallback generated avatar (hidden by default) */}
      <span
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex items-center justify-center 
          font-semibold text-white
          shadow-lg
          absolute inset-0
          hidden
          ${className}
        `}
        style={{ backgroundColor: fallbackAvatar.backgroundColor }}
      >
        {fallbackAvatar.initials}
      </span>

      {/* Rank indicator for higher ranks */}
      {echoes >= 1000 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-xs">
          {rank.icon}
        </span>
      )}
    </span>
  );
}