"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Flag, Ban, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { adminAPI } from "@/lib/admin-api";
import { AdminReport } from "@/types/admin-models";
import { FilterToggle, DataTable } from "@/components/ui";
import { ReportActionModal } from "./ReportActionModal";

/**
 * Self-contained reports management component for admin
 * Handles its own state to prevent parent re-renders
 */
export function ReportsManagement() {
  const { showSuccess, showError } = useToast();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

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

  const handleTakeAction = async (
    reportId: string,
    action: string,
    notes: string,
    banDurationDays?: number
  ) => {
    try {
      const newStatus = action === "dismiss" ? "dismissed" : "resolved";

      await adminAPI.takeActionOnReport(reportId, {
        status: newStatus,
        action,
        notes,
        ban_duration_days: banDurationDays,
      });

      showSuccess("Action taken successfully.");
      fetchReports();
    } catch (error) {
      console.error("Failed to take action:", error);
      showError("Failed to take action on report.");
      throw error;
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

  const statusOptions = ["all", "pending", "under_review", "resolved", "dismissed"];

  const columns = [
    {
      key: "report",
      header: "Report",
      render: (report: AdminReport) => (
        <div className="flex items-center gap-2">
          {getReportTypeIcon(report.report_type)}
          <div>
            <div className="font-semibold capitalize">{report.report_type}</div>
            <div className="text-sm text-secondary truncate max-w-xs">
              {report.reason}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "reporter",
      header: "Reporter",
      render: (report: AdminReport) => (
        <div className="font-medium">{report.reporter.username}</div>
      ),
    },
    {
      key: "reportedUser",
      header: "Reported User",
      render: (report: AdminReport) => (
        <div className="font-medium">
          {report.reported_user?.username || "N/A"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (report: AdminReport) => (
        <span
          className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(
            report.status
          )}`}
        >
          {report.status.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (report: AdminReport) => (
        <div className="text-sm">
          {new Date(report.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (report: AdminReport) => (
        <>
          {report.status === "pending" ? (
            <button
              onClick={() => {
                setSelectedReport(report);
                setShowActionModal(true);
              }}
              className="px-3 py-1 bg-primary/20 text-primary border border-primary rounded hover:bg-primary/30 transition-colors text-sm"
            >
              Take Action
            </button>
          ) : report.reviewed_by ? (
            <div className="text-xs text-secondary">
              Reviewed by {report.reviewed_by}
            </div>
          ) : null}
        </>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
      >
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((status) => (
            <FilterToggle
              key={status}
              label={status.replace("_", " ")}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              activeColor="primary"
            />
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
        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          emptyMessage="No reports found"
          rowKey={(r) => r.id}
        />
      </motion.div>

      {/* Action Modal */}
      <ReportActionModal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onAction={handleTakeAction}
      />
    </div>
  );
}
