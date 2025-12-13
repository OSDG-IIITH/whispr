"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Calendar, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "./UserAvatar";
import { RankBadge } from "./RankBadge";
import { EchoesDisplay } from "./EchoesDisplay";
import { formatDate } from "@/lib/utils";

interface UserHoverCardProps {
  username: string;
  echoes?: number;
  isVerified?: boolean;
  joinDate?: string;
  reviewCount?: number;
  children: React.ReactNode;
}

export function UserHoverCard({
  username,
  echoes = 0,
  isVerified = false,
  joinDate = "2024-01-01",
  reviewCount = 0,
  children
}: UserHoverCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64"
          >
            <div className="bg-card/95 backdrop-blur-xl border border-primary/20 rounded-xl p-4 shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <UserAvatar username={username} echoes={echoes} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{username}</h4>
                    {isVerified && (
                      <Shield className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <RankBadge echoes={echoes} size="sm" />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-3">
                <EchoesDisplay echoes={echoes} size="sm" />

                <div className="flex items-center gap-4 text-xs text-secondary">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{reviewCount} reviews</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Since {formatDate(joinDate)}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => router.push(`/profile/${username}`)}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}