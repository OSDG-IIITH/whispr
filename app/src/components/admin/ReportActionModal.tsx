"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import { AdminReport } from "@/types/admin-models";

interface ReportActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AdminReport | null;
  onAction: (
    reportId: string,
    action: string,
    notes: string,
    banDurationDays?: number
  ) => Promise<void>;
}

/**
 * Modal for taking action on a report
 * Extracted from admin reports page
 */
export function ReportActionModal({
  isOpen,
  onClose,
  report,
  onAction,
}: ReportActionModalProps) {
  const [actionType, setActionType] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [banDuration, setBanDuration] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!report || !actionType) return;

    setIsSubmitting(true);
    try {
      await onAction(report.id, actionType, actionNotes, banDuration);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActionType("");
    setActionNotes("");
    setBanDuration(undefined);
    onClose();
  };

  if (!report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Take Action on Report"
      maxWidth="lg"
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
            disabled={!actionType || isSubmitting}
            className="flex-1 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Take Action"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Report Details */}
        <div className="bg-background/50 p-4 rounded-lg">
          <div className="font-semibold mb-2">Report Details</div>
          <div className="text-sm space-y-1">
            <div>
              <strong>Type:</strong> {report.report_type}
            </div>
            <div>
              <strong>Reporter:</strong> {report.reporter.username}
            </div>
            <div>
              <strong>Reported User:</strong>{" "}
              {report.reported_user?.username || "N/A"}
            </div>
            <div>
              <strong>Reason:</strong> {report.reason}
            </div>
          </div>
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Action</label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full p-3 bg-background/50 border border-border rounded-lg focus:border-primary focus:outline-none"
          >
            <option value="">Select an action</option>
            <option value="dismiss">Dismiss Report</option>
            <option value="warn_user">Warn User</option>
            <option value="delete_content">Delete Content</option>
            <option value="ban_user">Ban User</option>
          </select>
        </div>

        {/* Ban Duration (conditional) */}
        {actionType === "ban_user" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Ban Duration
            </label>
            <select
              value={banDuration || ""}
              onChange={(e) =>
                setBanDuration(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
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
        )}

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Admin Notes</label>
          <textarea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder="Add notes about this action..."
            className="w-full p-3 bg-background/50 border border-border rounded-lg focus:border-primary focus:outline-none"
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
