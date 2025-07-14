"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Send, X, ChevronDown } from "lucide-react";
import { ReviewFormProps } from "@/types/frontend-models";
import { MentionInput } from "@/components/common/MentionInput";
import { courseAPI } from "@/lib/api";
import Loader from "@/components/common/Loader";

interface TimePeriod {
  semester: string;
  year: number;
  professors: Array<{
    id: string;
    name: string;
  }>;
}

interface Professor {
  id: string;
  name: string;
}

export function ReviewForm({
  onSubmit,
  onCancel,
  courseId,
  initialContent = "",
  initialRating = 0,
  placeholder = "Share your honest thoughts about this course/professor...",
  submitText = "Submit Rating",
  title = "Rate & Review",
  disabled = false,
}: ReviewFormProps & {
  courseId?: string;
  initialContent?: string;
  initialRating?: number;
  submitText?: string;
  title?: string;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for time periods and professor selection
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>(null);
  const [selectedProfessors, setSelectedProfessors] = useState<Set<string>>(new Set());
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);

  // Load time periods when courseId is provided
  useEffect(() => {
    if (courseId) {
      loadTimePeriods();
    }
  }, [courseId]);

  const loadTimePeriods = async () => {
    if (!courseId) return;

    try {
      setLoadingPeriods(true);
      const periods = await courseAPI.getCourseTimePeriods(courseId);
      setTimePeriods(periods);
    } catch (error) {
      console.error("Error loading time periods:", error);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const handlePeriodSelect = (period: TimePeriod) => {
    setSelectedPeriod(period);
    // Auto-select all professors for the period
    const professorIds = new Set(period.professors.map(p => p.id));
    setSelectedProfessors(professorIds);
    setShowProfessorDropdown(true);
  };

  const handleProfessorToggle = (professorId: string) => {
    const newSelected = new Set(selectedProfessors);
    if (newSelected.has(professorId)) {
      newSelected.delete(professorId);
    } else {
      newSelected.add(professorId);
    }
    setSelectedProfessors(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const reviewData: any = {
        content: content.trim(),
        rating
      };

      // Add time period and professor data if selected
      if (selectedPeriod) {
        reviewData.semester = selectedPeriod.semester;
        reviewData.year = selectedPeriod.year;

        if (selectedProfessors.size > 0) {
          reviewData.professor_ids = Array.from(selectedProfessors);
        }
      }

      await onSubmit(reviewData);
      setContent("");
      setRating(0);
      setSelectedPeriod(null);
      setSelectedProfessors(new Set());
      setShowProfessorDropdown(false);
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
          className={`p-1 transition-colors ${isFilled
              ? "text-yellow-500"
              : "text-secondary hover:text-yellow-400"
            }`}
        >
          <Star className={`w-6 h-6 ${isFilled ? "fill-current" : ""}`} />
        </motion.button>
      );
    });
  };

  const formatPeriodLabel = (period: TimePeriod) => {
    return `${period.semester} '${period.year.toString().slice(-2)}`;
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
        {/* Time Period Selection */}
        {courseId && timePeriods.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Time Period <span className="text-secondary">(optional)</span>
              </label>
              <div className="relative">
                <select
                  value={selectedPeriod ? JSON.stringify(selectedPeriod) : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      const period = JSON.parse(e.target.value);
                      handlePeriodSelect(period);
                    } else {
                      setSelectedPeriod(null);
                      setSelectedProfessors(new Set());
                      setShowProfessorDropdown(false);
                    }
                  }}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 pr-8 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  disabled={loadingPeriods}
                >
                  <option value="">Select time period...</option>
                  {timePeriods.map((period, index) => (
                    <option key={index} value={JSON.stringify(period)}>
                      {formatPeriodLabel(period)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
              </div>
            </div>

            {/* Professor Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Professors{" "}
                <span className="text-secondary">
                  {selectedPeriod ? "(select/deselect)" : "(select time period first)"}
                </span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  disabled={!selectedPeriod}
                  onClick={() => setShowProfessorDropdown(!showProfessorDropdown)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-left focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedPeriod
                      ? selectedProfessors.size === 0
                        ? "No professors selected"
                        : selectedProfessors.size === selectedPeriod.professors.length
                          ? "All professors selected"
                          : `${selectedProfessors.size} professor${selectedProfessors.size === 1 ? '' : 's'} selected`
                      : "Select time period first"
                    }
                  </span>
                  <ChevronDown className="w-4 h-4 text-secondary ml-2 flex-shrink-0" />
                </button>

                {showProfessorDropdown && selectedPeriod && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {selectedPeriod.professors.map((professor) => (
                      <label
                        key={professor.id}
                        className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProfessors.has(professor.id)}
                          onChange={() => handleProfessorToggle(professor.id)}
                          className="mr-2 rounded border-border"
                        />
                        <span className="text-sm">{professor.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Rating <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-1">
            {renderStars()}
            {rating > 0 && (
              <span className="ml-2 text-sm text-secondary">
                {rating} star{rating !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Review <span className="text-secondary">(optional)</span>
          </label>
          <MentionInput
            value={content}
            onChange={setContent}
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

        {/* Review Target Summary */}
        {selectedPeriod && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="font-medium mb-1">Review will be associated with:</div>
            <div className="text-secondary space-y-1">
              <div>• Time Period: {formatPeriodLabel(selectedPeriod)}</div>
              {selectedProfessors.size > 0 ? (
                <div>
                  • Professors: {selectedPeriod.professors
                    .filter(p => selectedProfessors.has(p.id))
                    .map(p => p.name)
                    .join(", ")
                  }
                </div>
              ) : (
                <div>• Course only (no specific professors)</div>
              )}
            </div>
          </div>
        )}

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
            disabled={rating === 0 || isSubmitting || disabled}
            className="btn btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader size="sm" className="!w-4 !h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Posting..." : submitText}
          </button>
        </div>
      </form>

      {/* Click outside to close professor dropdown */}
      {showProfessorDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowProfessorDropdown(false)}
        />
      )}
    </motion.div>
  );
}
