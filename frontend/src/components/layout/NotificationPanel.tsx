"use client";

import { motion } from "framer-motion";
import { X, MessageSquare, Heart, Users, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { FrontendNotification } from "@/types/frontend-models";
import Loader from "@/components/common/Loader";

interface NotificationPanelProps {
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case "VOTE":
      return <Heart className="w-4 h-4 text-red-500" />;
    case "REPLY":
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case "RANK_CHANGE":
      return <Shield className="w-4 h-4 text-primary" />;
    case "MENTION":
      return <Users className="w-4 h-4 text-purple-500" />;
    case "SYSTEM":
      return <MessageSquare className="w-4 h-4 text-secondary" />;
    default:
      return <MessageSquare className="w-4 h-4 text-secondary" />;
  }
};

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

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
        {loading ? (
          <div className="p-6 text-center text-secondary">
            <Loader size="sm" className="mx-auto mb-2" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-secondary">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 hover:bg-primary/5 transition-colors cursor-pointer ${
                  !notification.read ? "bg-primary/10" : ""
                }`}
                onClick={async () => {
                  // Mark as read when clicked
                  if (!notification.read) {
                    await markAsRead(notification.id);
                  }

                  // Navigate based on notification type and source
                  let actionUrl = "";
                  if (
                    notification.source_type === "review" &&
                    notification.source_id
                  ) {
                    actionUrl = `/reviews/${notification.source_id}`;
                  } else if (
                    notification.source_type === "reply" &&
                    notification.source_id
                  ) {
                    actionUrl = `/replies/${notification.source_id}`;
                  } else if (
                    notification.source_type === "user" &&
                    notification.actor_username
                  ) {
                    actionUrl = `/profile/${notification.actor_username}`;
                  }

                  if (actionUrl) {
                    window.location.href = actionUrl;
                  }
                  onClose();
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-secondary text-sm mb-2 line-clamp-2">
                      {notification.content}
                    </p>
                    <p className="text-xs text-secondary">
                      {formatDate(notification.created_at)}
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
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="p-3 border-t border-border">
          <button
            onClick={async () => {
              await markAllAsRead();
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
