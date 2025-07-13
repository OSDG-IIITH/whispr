"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Flag,
  AlertTriangle,
  MessageSquare,
  Shield,
  ShieldAlert,
} from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportType: string, reason: string) => void;
  targetType: "review" | "reply" | "user";
  targetId: string;
}

const reportTypes = [
  {
    id: "spam",
    label: "Spam",
    description: "Repetitive, unwanted, or promotional content",
    icon: Shield,
  },
  {
    id: "harassment",
    label: "Harassment",
    description: "Bullying, threats, or targeted harassment",
    icon: ShieldAlert,
  },
  {
    id: "inappropriate",
    label: "Inappropriate Content",
    description: "Content that violates community guidelines",
    icon: AlertTriangle,
  },
  {
    id: "misinformation",
    label: "Misinformation",
    description: "False or misleading information",
    icon: MessageSquare,
  },
  {
    id: "other",
    label: "Other",
    description: "Something else that doesn't fit the above categories",
    icon: Flag,
  },
];

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  targetType,
  targetId,
}: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedType, reason.trim());
      onClose();
      setSelectedType("");
      setReason("");
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    setSelectedType("");
    setReason("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-400" />
                    <h2 className="text-xl font-semibold">
                      Report {targetType}
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="p-2 hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-secondary text-sm mt-2">
                  Help us keep the community safe by reporting inappropriate
                  content.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Report Type Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    What's the issue?
                  </h3>
                  <div className="space-y-2">
                    {reportTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <label
                          key={type.id}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                            ${
                              selectedType === type.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="reportType"
                            value={type.id}
                            checked={selectedType === type.id}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="mt-1"
                          />
                          <IconComponent className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">
                              {type.label}
                            </div>
                            <div className="text-xs text-secondary">
                              {type.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium mb-2"
                  >
                    Additional details (required)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide more details about why you're reporting this content..."
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    required
                  />
                  <div className="text-xs text-secondary mt-1">
                    {reason.length}/500 characters
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-secondary border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedType || !reason.trim() || isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
