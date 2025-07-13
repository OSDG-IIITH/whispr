"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMentions } from "@/hooks/useMentions";
import { UserAvatar } from "@/components/user/UserAvatar";
import { RankBadge } from "@/components/user/RankBadge";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  rows?: number;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Type @ to mention someone...",
  className = "",
  maxLength,
  rows = 3,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const {
    isOpen,
    mentionUsers,
    selectedIndex,
    query,
    openMention,
    closeMention,
    selectUser,
    navigateSelection,
    updateQuery,
  } = useMentions();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(position);

    // Check for @ symbol
    const textBeforeCursor = newValue.slice(0, position);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

      // Check if we're still in the mention (no spaces after @)
      if (!textAfterAt.includes(" ") && textAfterAt.length <= 20) {
        setMentionPosition({ start: lastAtIndex, end: position });
        updateQuery(textAfterAt);
        if (!isOpen) {
          openMention(textAfterAt);
        }
      } else {
        closeMention();
        setMentionPosition(null);
      }
    } else {
      closeMention();
      setMentionPosition(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || mentionUsers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        navigateSelection("down");
        break;
      case "ArrowUp":
        e.preventDefault();
        navigateSelection("up");
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        insertMention();
        break;
      case "Escape":
        e.preventDefault();
        closeMention();
        break;
    }
  };

  const insertMention = (index?: number) => {
    const username = selectUser(index);
    if (!username || !mentionPosition) return;

    const beforeMention = value.slice(0, mentionPosition.start);
    const afterMention = value.slice(mentionPosition.end);
    const newValue = `${beforeMention}@${username} ${afterMention}`;

    onChange(newValue);
    setMentionPosition(null);

    // Focus and position cursor after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = mentionPosition.start + username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const getMentionDropdownPosition = () => {
    if (!textareaRef.current || !mentionPosition) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const textBeforeMention = value.slice(0, mentionPosition.start);

    // Create a temporary div to measure text position
    const div = document.createElement("div");
    div.style.cssText = window.getComputedStyle(textarea).cssText;
    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.height = "auto";
    div.style.whiteSpace = "pre-wrap";
    div.textContent = textBeforeMention;

    document.body.appendChild(div);
    const rect = textarea.getBoundingClientRect();
    const lineHeight =
      parseInt(window.getComputedStyle(textarea).lineHeight) || 20;

    document.body.removeChild(div);

    return {
      top: rect.bottom + 5,
      left: rect.left,
    };
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none ${className}`}
      />

      {/* Mention Dropdown */}
      <AnimatePresence>
        {isOpen && mentionUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 w-72 bg-card border border-primary/20 rounded-lg shadow-2xl overflow-hidden"
            style={getMentionDropdownPosition()}
          >
            {mentionUsers.map((user, index) => (
              <button
                key={user.username}
                onClick={() => insertMention(index)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-primary/10 border-l-2 border-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <UserAvatar
                  username={user.username}
                  echoes={user.echoes}
                  size="sm"
                  avatarUrl={user.avatar_url}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {user.username}
                    </span>
                    {!user.is_muffled && (
                      <span className="text-primary text-xs">✓</span>
                    )}
                  </div>
                  <RankBadge echoes={user.echoes} size="sm" showIcon={false} />
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
