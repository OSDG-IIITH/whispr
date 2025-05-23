"use client";

import { useState, useCallback } from "react";

interface User {
  username: string;
  echoes: number;
  isVerified: boolean;
}

export function useMentions() {
  const [isOpen, setIsOpen] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMentionUsers([]);
      return;
    }

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/v1/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const users = await response.json();
        setMentionUsers(users.slice(0, 5)); // Limit to 5 results
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
      setMentionUsers([]);
    }
  }, []);

  const openMention = useCallback((searchQuery: string = "") => {
    setIsOpen(true);
    setQuery(searchQuery);
    searchUsers(searchQuery);
  }, [searchUsers]);

  const closeMention = useCallback(() => {
    setIsOpen(false);
    setMentionUsers([]);
    setSelectedIndex(0);
    setQuery("");
  }, []);

  const selectUser = useCallback((index: number = selectedIndex) => {
    const user = mentionUsers[index];
    if (user) {
      closeMention();
      return user.username;
    }
    return null;
  }, [mentionUsers, selectedIndex, closeMention]);

  const navigateSelection = useCallback((direction: "up" | "down") => {
    if (mentionUsers.length === 0) return;

    setSelectedIndex(prev => {
      if (direction === "up") {
        return prev > 0 ? prev - 1 : mentionUsers.length - 1;
      } else {
        return prev < mentionUsers.length - 1 ? prev + 1 : 0;
      }
    });
  }, [mentionUsers.length]);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    searchUsers(newQuery);
  }, [searchUsers]);

  return {
    isOpen,
    mentionUsers,
    selectedIndex,
    query,
    openMention,
    closeMention,
    selectUser,
    navigateSelection,
    updateQuery
  };
}