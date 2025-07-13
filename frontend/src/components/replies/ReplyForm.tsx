"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { MentionInput } from "@/components/common/MentionInput";

interface ReplyFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  initialContent?: string;
  disabled?: boolean;
}

export function ReplyForm({ 
  onSubmit, 
  onCancel, 
  placeholder = "Write a thoughtful reply...",
  initialContent = "",
  disabled = false
}: ReplyFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 border border-primary/20 rounded-lg p-4 ml-12"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <MentionInput
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          maxLength={500}
          rows={3}
          disabled={disabled || isSubmitting}
        />
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-secondary">
            {content.length}/500 characters
          </span>
          
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="p-2 text-secondary hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting || disabled}
              className="btn btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              {isSubmitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}