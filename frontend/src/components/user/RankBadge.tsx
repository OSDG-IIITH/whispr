"use client";

import { getRankWithProgress } from "@/lib/utils";

interface RankBadgeProps {
  echoes: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showProgress?: boolean;
}

export function RankBadge({ echoes, size = "md", showIcon = true, showProgress = false }: RankBadgeProps) {
  const rank = getRankWithProgress(echoes);
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm", 
    lg: "px-4 py-2 text-base"
  };

  const iconSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };  // Calculate progress to next rank
  const progress = rank.max === Infinity 
    ? 100 
    : Math.min(100, ((echoes - rank.min) / (rank.max - rank.min)) * 100);

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          bg-gradient-to-r ${rank.gradient}
          text-white shadow-sm
          ${sizeClasses[size]}
        `}
      >
        {showIcon && (
          <span className={iconSizes[size]}>{rank.icon}</span>
        )}
        <span>{rank.name}</span>
      </div>
      
      {showProgress && rank.max !== Infinity && (
        <div className="flex items-center gap-2 text-xs text-secondary">
          <div className="flex-1 bg-muted rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-primary to-green-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{rank.echoesToNext} to next</span>
        </div>
      )}
    </div>
  );
}