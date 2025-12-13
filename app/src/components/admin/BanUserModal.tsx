"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import { AdminUser } from "@/types/admin-models";

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onBan: (userId: string, reason: string, durationDays?: number) => Promise<void>;
}

/**
 * Modal for banning a user
 * Extracted from admin users page
 */
export function BanUserModal({
  isOpen,
  onClose,
  user,
  onBan,
}: BanUserModalProps) {
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !banReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onBan(user.id, banReason, banDuration);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBanReason("");
    setBanDuration(undefined);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Ban User: ${user.username}`}
      footer={
        <>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-background/50 border border-border rounded-lg hover:border-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!banReason.trim() || isSubmitting}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Banning..." : "Ban User"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Reason for ban
          </label>
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Enter the reason for banning this user..."
            className="w-full p-3 bg-background/50 border border-border rounded-lg focus:border-primary focus:outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ban Duration</label>
          <select
            value={banDuration || ""}
            onChange={(e) =>
              setBanDuration(e.target.value ? parseInt(e.target.value) : undefined)
            }
            className="w-full p-3 bg-background/50 border border-border rounded-lg focus:border-primary focus:outline-none"
          >
            <option value="">Permanent</option>
            <option value="1">1 Day</option>
            <option value="3">3 Days</option>
            <option value="7">1 Week</option>
            <option value="30">1 Month</option>
            <option value="90">3 Months</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
