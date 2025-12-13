"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Flag,
  Ban,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { adminAPI } from "@/lib/admin-api";
import { AdminReport } from "@/types/admin-models";
import Loader from "@/components/common/Loader";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(
    null
  );
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [banDuration, setBanDuration] = useState<number | undefined>(undefined);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const reportsData = await adminAPI.getReports({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 100,
      });
      setReports(reportsData);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      showError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showError]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleTakeAction = async () => {
    if (!selectedReport || !actionType) return;

    try {
      const newStatus = actionType === "dismiss" ? "dismissed" : "resolved";

      await adminAPI.takeActionOnReport(selectedReport.id, {
        status: newStatus,
        action: actionType,
        notes: actionNotes,
        ban_duration_days: banDuration,
      });

      showSuccess("Action taken successfully.");
      setShowActionModal(false);
      setSelectedReport(null);
      setActionType("");
      setActionNotes("");
      setBanDuration(undefined);
      fetchReports();
    } catch (error) {
      console.error("Failed to take action:", error);
      showError("Failed to take action on report.");
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "spam":
        return <AlertTriangle className="w-4 h-4" />;
      case "harassment":
        return <Ban className="w-4 h-4" />;
      case "inappropriate":
        return <X className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-300 bg-yellow-500/20";
      case "under_review":
        return "text-blue-300 bg-blue-500/20";
      case "resolved":
        return "text-green-300 bg-green-500/20";
      case "dismissed":
        return "text-gray-300 bg-gray-500/20";
      default:
        return "text-gray-300 bg-gray-500/20";
    }
  };

  if (!user || !(user as { is_admin?: boolean }).is_admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Flag className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-secondary">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Report Management</h1>
          <p className="text-secondary">
            Review and take action on user reports
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6 mb-6"
        >
          <div className="flex gap-2">
            {["all", "pending", "under_review", "resolved", "dismissed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg border transition-colors capitalize ${statusFilter === status
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-background/50 border-border hover:border-primary"
                  }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">Report</th>
                    <th className="text-left p-4 font-semibold">Reporter</th>
                    <th className="text-left p-4 font-semibold">
                      Reported User
                    </th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-border/50 hover:bg-background/20"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getReportTypeIcon(report.report_type)}
                          <div>
                            <div className="font-semibold capitalize">
                              {report.report_type}
                            </div>
                            <div className="text-sm text-secondary truncate max-w-xs">
                              {report.reason}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {report.reporter.username}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {report.reported_user?.username || "N/A"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {report.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        {report.status === "pending" && (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowActionModal(true);
                            }}
                            className="px-3 py-1 bg-primary/20 text-primary border border-primary rounded hover:bg-primary/30 transition-colors text-sm"
                          >
                            Take Action
                          </button>
                        )}
                        {report.status !== "pending" && report.reviewed_by && (
                          <div className="text-xs text-secondary">
                            Reviewed by {report.reviewed_by}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Action Modal */}
        {showActionModal && selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-primary/20 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Take Action on Report</h2>

              <div className="space-y-4 mb-6">
                <div className="bg-background/50 p-4 rounded-lg">
                  <div className="font-semibold mb-2">Report Details</div>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Type:</strong> {selectedReport.report_type}
                    </div>
                    <div>
                      <strong>Reporter:</strong>{" "}
                      {selectedReport.reporter.username}
                    </div>
                    <div>
                      <strong>Reported User:</strong>{" "}
                      {selectedReport.reported_user?.username || "N/A"}
                    </div>
                    <div>
                      <strong>Reason:</strong> {selectedReport.reason}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Action
                  </label>
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

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add notes about this action..."
                    className="w-full p-3 bg-background/50 border border-border rounded-lg focus:border-primary focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedReport(null);
                    setActionType("");
                    setActionNotes("");
                    setBanDuration(undefined);
                  }}
                  className="flex-1 px-4 py-2 bg-background/50 border border-border rounded-lg hover:border-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTakeAction}
                  disabled={!actionType}
                  className="flex-1 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Take Action
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
