"use client";

import { useState, useEffect } from "react";
import { notificationAPI } from "@/lib/api";
import { Notification } from "@/types/backend-models";
import {
  FrontendNotification,
  convertNotificationToFrontendNotification,
} from "@/types/frontend-models";

export function useNotifications() {
  const [notifications, setNotifications] = useState<FrontendNotification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.getNotifications();
      // Transform backend notifications to frontend format
      const frontendNotifications = data.map((n) =>
        convertNotificationToFrontendNotification(n)
      );
      setNotifications(frontendNotifications);
      setUnreadCount(frontendNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const addNotification = (notification: Omit<Notification, "id">) => {
    const backendNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
    };

    const newNotification =
      convertNotificationToFrontendNotification(backendNotification);

    setNotifications((prev) => [newNotification, ...prev]);
    if (!newNotification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    refresh: fetchNotifications,
  };
}
