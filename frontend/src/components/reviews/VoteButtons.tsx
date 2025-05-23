"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down" | null;
  onVote: (type: "up" | "down") => void;
  disabled?: boolean;
}

export function VoteButtons({ 
  upvotes, 
  downvotes, 
  userVote = null, 
  onVote, 
  disabled = false 
}: VoteButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (type: "up" | "down") => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onVote(type);
    } finally {
      setIsLoading(false);
    }
  };

  const netScore = upvotes - downvotes;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Upvote Button */}
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={() => handleVote("up")}
        disabled={disabled || isLoading}
        className={`
          p-1.5 rounded-lg transition-colors relative
          ${userVote === "up" 
            ? 'bg-green-500 text-white' 
            : 'text-secondary hover:text-green-500 hover:bg-green-500/10'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <ChevronUp className="w-5 h-5" />
        {isLoading && userVote !== "up" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </motion.button>

      {/* Score Display */}
      <motion.div
        key={netScore}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`
          text-sm font-medium px-2 py-1 rounded
          ${netScore > 0 
            ? 'text-green-400' 
            : netScore < 0 
            ? 'text-red-400' 
            : 'text-secondary'
          }
        `}
      >
        {netScore > 0 ? '+' : ''}{netScore}
      </motion.div>

      {/* Downvote Button */}
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={() => handleVote("down")}
        disabled={disabled || isLoading}
        className={`
          p-1.5 rounded-lg transition-colors relative
          ${userVote === "down" 
            ? 'bg-red-500 text-white' 
            : 'text-secondary hover:text-red-500 hover:bg-red-500/10'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <ChevronDown className="w-5 h-5" />
        {isLoading && userVote !== "down" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </motion.button>
    </div>
  );
}