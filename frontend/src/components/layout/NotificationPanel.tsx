"use client";

import { motion } from "framer-motion";
import { X, MessageSquare, Heart, Users, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface NotificationPanelProps {
  onClose: () => void;
}

interface Notification {
  id: string;
  type: "mention" | "vote" | "reply" | "rank" | "system";
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "vote",
    title: "Your review was upvoted",
    content: "Someone found your Computer Networks review helpful",
    timestamp: "2024-01-20T10:30:00Z",
    read: false,
    actionUrl: "/courses/cs101"
  },
  {
    id: "2", 
    type: "reply",
    title: "New reply to your review",
    content: "anonymous_student replied to your DS&A review",
    timestamp: "2024-01-20T09:15:00Z",
    read: false,
    actionUrl: "/courses/cs202"
  },
  {
    id: "3",
    type: "rank",
    title: "Rank up!",
    content: "You've reached Trusted Whisperer rank with 500 echoes!",
    timestamp: "2024-01-19T18:45:00Z",
    read: true,
    actionUrl: "/profile/me"
  },
  {
    id: "4",
    type: "mention",
    title: "You were mentioned",
    content: "Someone mentioned you in a review discussion",
    timestamp: "2024-01-19T14:20:00Z",
    read: true,
    actionUrl: "/courses/cs301"
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "vote":
      return <Heart className="w-4 h-4 text-red-500" />;
    case "reply":
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case "rank":
      return <Shield className="w-4 h-4 text-primary" />;
    case "mention":
      return <Users className="w-4 h-4 text-purple-500" />;
    default:
      return <MessageSquare className="w-4 h-4 text-secondary" />;
  }
};

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-xl shadow-2xl max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-black text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-secondary hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {mockNotifications.length === 0 ? (
          <div className="p-6 text-center text-secondary">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mockNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 hover:bg-primary/5 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-primary/10' : ''
                }`}
                onClick={() => {
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                  onClose();
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">
                      {notification.title}
                    </p>
                    <p className="text-secondary text-sm mb-2 line-clamp-2">
                      {notification.content}
                    </p>
                    <p className="text-xs text-secondary">
                      {formatDate(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {mockNotifications.length > 0 && (
        <div className="p-3 border-t border-border">
          <button
            onClick={() => {
              // TODO: Mark all as read
              onClose();
            }}
            className="w-full text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}