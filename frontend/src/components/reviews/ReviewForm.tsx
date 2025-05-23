"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send, X } from "lucide-react";

interface ReviewFormProps {
  onSubmit: (data: { content: string; rating: number }) => void;
  onCancel?: () => void;
  initialContent?: string;
  initialRating?: number;
  placeholder?: string;
  submitText?: string;
  title?: string;
}

export function ReviewForm({ 
  onSubmit, 
  onCancel, 
  initialContent = "", 
  initialRating = 0,
  placeholder = "Share your honest thoughts about this course/professor...",
  submitText = "Post Review",
  title = "Write a Review"
}: ReviewFormProps) {
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ content: content.trim(), rating });
      setContent("");
      setRating(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFilled = starValue <= (hoveredRating || rating);
      
      return (
        <motion.button
          key={i}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className={`p-1 transition-colors ${
            isFilled ? 'text-yellow-500' : 'text-secondary hover:text-yellow-400'
          }`}
        >
          <Star className={`w-6 h-6 ${isFilled ? 'fill-current' : ''}`} />
        </motion.button>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/20 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-secondary hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Rating <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-1">
            {renderStars()}
            {rating > 0 && (
              <span className="ml-2 text-sm text-secondary">
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Review <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-secondary">
              {content.length}/1000 characters
            </span>
            {content.length > 900 && (
              <span className="text-xs text-yellow-400">
                Character limit approaching
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-secondary hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || rating === 0 || isSubmitting}
            className="btn btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Posting..." : submitText}
          </button>
        </div>
      </form>
    </motion.div>
  );
}