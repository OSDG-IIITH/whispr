"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { History, User, Calendar } from "lucide-react";
import { adminAPI, AuditLogEntry, AuditActionType, AuditEntityType } from "@/lib/admin-api";
import { useToast } from "@/providers/ToastProvider";
import { Select, EmptyState, Pagination, Modal } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";
import Loader from "@/components/common/Loader";

const PAGE_SIZE = 25;

interface LogDetailsModalProps {
  log: AuditLogEntry | null;
  onClose: () => void;
}

function LogDetailsModal({ log, onClose }: LogDetailsModalProps) {
  if (!log) return null;

  return (
    <Modal isOpen={!!log} onClose={onClose} title="Audit Log Details">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-secondary mb-1">Log ID</p>
            <p className="font-mono text-xs">{log.id}</p>
          </div>
          <div>
            <p className="font-medium text-secondary mb-1">Timestamp</p>
            <p>{new Date(log.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-medium text-secondary mb-1">Actor</p>
            <p>{log.admin_name}</p>
          </div>
          <div>
            <p className="font-medium text-secondary mb-1">Action</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action_type)}`}>
              {log.action_type}
            </span>
          </div>
          <div>
            <p className="font-medium text-secondary mb-1">Target Entity</p>
            <p>{log.entity_name || "-"}</p>
          </div>
          <div>
            <p className="font-medium text-secondary mb-1">Entity Type</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEntityBadgeColor(log.entity_type)}`}>
              {log.entity_type}
            </span>
          </div>
        </div>

        <div>
          <p className="font-medium text-secondary mb-2">Change Details</p>
          <div className="bg-black/50 border border-border rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs sm:text-sm font-mono text-primary/90">
              {log.details ? JSON.stringify(log.details, null, 2) : "No additional details"}
            </pre>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

const ACTION_TYPES: { value: AuditActionType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "MERGE", label: "Merge" },
  { value: "BAN", label: "Ban" },
  { value: "UNBAN", label: "Unban" },
  { value: "MAKE_ADMIN", label: "Make Admin" },
  { value: "REMOVE_ADMIN", label: "Remove Admin" },
  { value: "REPORT_DISMISS", label: "Dismiss Report" },
  { value: "REPORT_RESOLVE", label: "Resolve Report" },
];

const ENTITY_TYPES: { value: AuditEntityType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Entities" },
  { value: "PROFESSOR", label: "Professor" },
  { value: "COURSE", label: "Course" },
  { value: "USER", label: "User" },
  { value: "REPORT", label: "Report" },
];

function getActionBadgeColor(action: string): string {
  switch (action) {
    case "CREATE":
      return "bg-green-500/20 text-green-400";
    case "UPDATE":
      return "bg-blue-500/20 text-blue-400";
    case "DELETE":
      return "bg-red-500/20 text-red-400";
    case "MERGE":
      return "bg-yellow-500/20 text-yellow-400";
    case "BAN":
      return "bg-red-500/20 text-red-400";
    case "UNBAN":
      return "bg-green-500/20 text-green-400";
    case "MAKE_ADMIN":
      return "bg-purple-500/20 text-purple-400";
    case "REMOVE_ADMIN":
      return "bg-orange-500/20 text-orange-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

function getEntityBadgeColor(entity: string): string {
  switch (entity) {
    case "PROFESSOR":
      return "bg-cyan-500/20 text-cyan-400";
    case "COURSE":
      return "bg-emerald-500/20 text-emerald-400";
    case "USER":
      return "bg-violet-500/20 text-violet-400";
    case "REPORT":
      return "bg-amber-500/20 text-amber-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

export function AuditLogViewer() {
  const { showError } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [admins, setAdmins] = useState<{ id: string; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedAdmin, setSelectedAdmin] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState<AuditActionType | "ALL">("ALL");
  const [selectedEntity, setSelectedEntity] = useState<AuditEntityType | "ALL">("ALL");
  
  const [viewingLog, setViewingLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!initialLoading) {
      setRefreshing(true);
    }
    try {
      const result = await adminAPI.getAuditLogs({
        admin_id: selectedAdmin !== "ALL" ? selectedAdmin : undefined,
        action_type: selectedAction !== "ALL" ? selectedAction : undefined,
        entity_type: selectedEntity !== "ALL" ? selectedEntity : undefined,
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setLogs(result.logs);
      setTotal(result.total);
      setAdmins(result.admins);
    } catch (error) {
      showError("Failed to load audit logs");
      console.error(error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [selectedAdmin, selectedAction, selectedEntity, currentPage, showError, initialLoading]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAdmin, selectedAction, selectedEntity]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={selectedAdmin}
            onChange={setSelectedAdmin}
            options={[
              { value: "ALL", label: "All Admins" },
              ...admins.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <Select
            value={selectedAction}
            onChange={(v) => setSelectedAction(v as AuditActionType | "ALL")}
            options={ACTION_TYPES}
          />
          <Select
            value={selectedEntity}
            onChange={(v) => setSelectedEntity(v as AuditEntityType | "ALL")}
            options={ENTITY_TYPES}
          />
        </div>
      </motion.div>

      {/* Logs Table */}
      <div className="relative">
        {refreshing && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
            <Loader />
          </div>
        )}
        {logs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-primary/20 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Admin</th>
                    <th className="text-left p-4 font-semibold">Action</th>
                    <th className="text-left p-4 font-semibold">Entity</th>
                    <th className="text-left p-4 font-semibold">Target</th>
                    <th className="text-left p-4 font-semibold hidden lg:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-background/20">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-secondary hidden sm:block" />
                          <span className="text-sm">{formatRelativeTime(log.created_at)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-secondary hidden sm:block" />
                          <span className="font-medium">{log.admin_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEntityBadgeColor(log.entity_type)}`}>
                          {log.entity_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-secondary">{log.entity_name || "-"}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setViewingLog(log)}>
                        <div className="max-w-xs truncate text-sm text-secondary font-mono">
                          {log.details ? JSON.stringify(log.details) : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-border">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </motion.div>
        ) : (
          <EmptyState
            icon={<History className="w-16 h-16" />}
            title="No audit logs found"
            description="Admin actions will appear here"
          />
        )}
      </div>

      <LogDetailsModal
        log={viewingLog}
        onClose={() => setViewingLog(null)}
      />
    </div>
  );
}
