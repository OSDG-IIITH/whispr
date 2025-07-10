"use client";

import { motion } from "framer-motion";
import { X, Settings, Shield, LogOut, User, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user/UserAvatar";
import { RankBadge } from "@/components/user/RankBadge";
import { EchoesDisplay } from "@/components/user/EchoesDisplay";
import { useAuth } from "@/providers/AuthProvider";

interface ProfileMenuProps {
  onClose: () => void;
}

export function ProfileMenu({ onClose }: ProfileMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, redirect to home
      router.push('/');
    }
  };

  const handleViewProfile = () => {
    onClose();
    router.push(`/profile/${user?.username}`);
  };

  const handleMyReviews = () => {
    onClose();
    router.push('/my-reviews');
  };

  const handleSettings = () => {
    onClose();
    router.push('/settings');
  };

  const handleVerifyAccount = () => {
    onClose();
    router.push('/verify');
  };

  if (!user) {
    return null;
  }

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
          <UserAvatar username={user.username} echoes={user.echoes} size="lg" avatarUrl={user.avatar_url} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{user.username}</h4>
              {!user.is_muffled && (
                <Shield className="w-4 h-4 text-primary" />
              )}
            </div>
            <RankBadge echoes={user.echoes} size="sm" />
          </div>
        </div>
        <EchoesDisplay echoes={user.echoes} />
      </div>

      {/* Menu Items */}
      <div className="p-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleViewProfile}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <User className="w-5 h-5 text-secondary" />
          <span>View Profile</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMyReviews}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Star className="w-5 h-5 text-secondary" />
          <span>My Reviews</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSettings}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Settings className="w-5 h-5 text-secondary" />
          <span>Settings</span>
        </motion.button>

        {user.is_muffled && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerifyAccount}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <Shield className="w-5 h-5 text-secondary" />
            <span>Verify Account</span>
          </motion.button>
        )}

        <div className="border-t border-border my-2" />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </div>
  );
}