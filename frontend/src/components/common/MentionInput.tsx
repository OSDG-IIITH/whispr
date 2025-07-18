"use client";

import { useRef, useState } from "react";
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
  disabled?: boolean;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Type @ to mention someone...",
  className = "",
  maxLength,
  rows = 3,
  disabled = false,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, setCursorPosition] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const {
    isOpen,
    mentionUsers,
    selectedIndex,
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

    console.log('⌨️ Input changed:', { newValue, position, textBeforeCursor, lastAtIndex });

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      console.log('📍 Found @ at position', lastAtIndex, 'text after @:', textAfterAt);

      // Check if we're still in the mention (no spaces after @)
      if (!textAfterAt.includes(" ") && textAfterAt.length <= 20) {
        console.log('✅ Valid mention, opening dropdown');
        setMentionPosition({ start: lastAtIndex, end: position });
        updateQuery(textAfterAt);
        if (!isOpen) {
          openMention(textAfterAt);
        }
      } else {
        console.log('❌ Invalid mention (space found or too long), closing');
        closeMention();
        setMentionPosition(null);
      }
    } else {
      console.log('🚫 No @ found, closing mention');
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
        disabled={disabled}
        className={`w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      />

      {/* Mention Dropdown */}
      <AnimatePresence>
        {isOpen && mentionUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full mt-1 left-0 w-72 bg-card border border-primary/20 rounded-lg shadow-2xl overflow-hidden"
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
