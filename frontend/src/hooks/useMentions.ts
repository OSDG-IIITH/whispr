"use client";

import { useState, useCallback } from "react";
import { userSearchAPI, type User } from "@/lib/api";

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
      console.log('Searching users for:', searchQuery);
      const users = await userSearchAPI.searchUsers(searchQuery);
      console.log('Search results:', users);
      setMentionUsers(users.slice(0, 5)); // Limit to 5 results
      setSelectedIndex(0);
      console.log('Set mentionUsers to:', users.slice(0, 5));
    } catch (error) {
      console.error("Failed to search users:", error);
      // In case of error, still show empty results instead of breaking
      setMentionUsers([]);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        console.warn("User search requires authentication. User mentions may not work properly.");
      }
    }
  }, []);

  const openMention = useCallback((searchQuery: string = "") => {
    console.log('openMention called with:', searchQuery);
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