"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Home, User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { ProfileMenu } from "./ProfileMenu";
import { NotificationPanel } from "./NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";

export function FloatingDock() {
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { unreadCount } = useNotifications();

  // Hide dock on auth pages
  if (pathname?.startsWith('/auth') || pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {(showSearch || showNotifications || showProfile) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => {
              setShowSearch(false);
              setShowNotifications(false);
              setShowProfile(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Dock */}
      <div className="fixed bottom-2 sm:bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-2xl px-2 py-2 sm:px-4 sm:py-3 shadow-2xl max-w-xs sm:max-w-md w-full pointer-events-auto flex justify-center">
            <div className="flex items-center gap-4">
              {/* Logo/Home */}
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl transition-colors ${pathname === '/dashboard'
                    ? 'bg-primary text-black'
                    : 'text-primary hover:bg-primary/10'
                    }`}
                >
                  <Home className="w-5 h-5" />
                </motion.button>
              </Link>

              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSearch(!showSearch);
                  setShowNotifications(false);
                  setShowProfile(false);
                }}
                className={`p-3 rounded-xl transition-colors ${showSearch
                  ? 'bg-primary text-black'
                  : 'text-primary hover:bg-primary/10'
                  }`}
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSearch(false);
                  setShowProfile(false);
                }}
                className={`p-3 rounded-xl transition-colors relative ${showNotifications
                  ? 'bg-primary text-black'
                  : 'text-primary hover:bg-primary/10'
                  }`}
              >
                <Bell className="w-5 h-5" />
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs flex items-center justify-center text-black font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Profile */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowSearch(false);
                  setShowNotifications(false);
                }}
                className={`p-3 rounded-xl transition-colors ${showProfile
                  ? 'bg-primary text-black'
                  : 'text-primary hover:bg-primary/10'
                  }`}
              >
                <User className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Panel */}
      <div className="fixed bottom-28 left-0 right-0 z-50 flex justify-center">
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <SearchBar onClose={() => setShowSearch(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications Panel */}
      <div className="fixed bottom-28 left-0 right-0 z-50 flex justify-center">
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-80"
            >
              <NotificationPanel onClose={() => setShowNotifications(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Menu */}

      < div className="fixed bottom-28 left-0 right-0 z-50 flex justify-center" >
        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-64"
            >
              <ProfileMenu onClose={() => setShowProfile(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}