"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface EchoesDisplayProps {
  echoes: number;
  recentChange?: number;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
}

export function EchoesDisplay({ 
  echoes, 
  recentChange = 0, 
  size = "md", 
  showTrend = true 
}: EchoesDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div 
        className={`font-bold text-primary ${sizeClasses[size]}`}
        whileHover={{ scale: 1.05 }}
      >
        {formatNumber(echoes)} echoes
      </motion.div>
      
      {showTrend && recentChange !== 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            recentChange > 0 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {recentChange > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{recentChange > 0 ? '+' : ''}{recentChange}</span>
        </motion.div>
      )}
    </div>
  );
}