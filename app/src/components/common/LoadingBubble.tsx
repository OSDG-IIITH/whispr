"use client";

import { motion } from "framer-motion";

interface LoadingBubbleProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingBubble({ message = "Loading...", size = "md" }: LoadingBubbleProps) {
  const sizeClasses = {
    sm: "text-sm p-3",
    md: "text-base p-4", 
    lg: "text-lg p-6"
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        bg-card/80 backdrop-blur-sm border border-primary/20 rounded-xl 
        flex items-center gap-3 shadow-lg
        ${sizeClasses[size]}
      `}
    >
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className={`bg-primary rounded-full ${dotSizes[size]}`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
      <span className="text-secondary">{message}</span>
    </motion.div>
  );
}