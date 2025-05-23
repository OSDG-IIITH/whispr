"use client";

import { motion } from "framer-motion";
import { User, Settings, Shield, LogOut, X } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/user/UserAvatar";
import { RankBadge } from "@/components/user/RankBadge";
import { EchoesDisplay } from "@/components/user/EchoesDisplay";

interface ProfileMenuProps {
  onClose: () => void;
}

// Mock user data
const mockUser = {
  id: "1",
  username: "anonymous_whisperer",
  echoes: 150,
  rank: "trusted_whisperer",
  is_verified: true,
  is_admin: false
};

export function ProfileMenu({ onClose }: ProfileMenuProps) {
  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Logging out...");
    onClose();
  };

  return (
    <div className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">Profile</h3>
        <button
          onClick={onClose}
          className="text-secondary hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <UserAvatar username={mockUser.username} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{mockUser.username}</h4>
              {mockUser.is_verified && (
                <Shield className="w-4 h-4 text-primary" />
              )}
            </div>
            <RankBadge echoes={mockUser.echoes} size="sm" />
          </div>
        </div>
        <EchoesDisplay echoes={mockUser.echoes} />
      </div>

      {/* Menu Items */}
      <div className="p-2">
        <Link href={`/profile/${mockUser.username}`}>
          <motion.button
            whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
          >
            <User className="w-4 h-4 text-secondary" />
            <span>View Profile</span>
          </motion.button>
        </Link>

        <motion.button
          whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
        >
          <Settings className="w-4 h-4 text-secondary" />
          <span>Settings</span>
        </motion.button>

        {mockUser.is_admin && (
          <Link href="/admin">
            <motion.button
              whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
            >
              <Shield className="w-4 h-4 text-yellow-500" />
              <span>Admin Panel</span>
            </motion.button>
          </Link>
        )}

        <div className="border-t border-border my-2"></div>

        <motion.button
          whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-red-400 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </motion.button>
      </div>
    </div>
  );
}