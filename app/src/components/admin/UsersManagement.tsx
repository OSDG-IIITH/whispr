"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Ban, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { adminAPI } from "@/lib/admin-api";
import { AdminUser } from "@/types/admin-models";
import { SearchInput, FilterToggle, DataTable } from "@/components/ui";
import { BanUserModal } from "./BanUserModal";

/**
 * Self-contained users management component for admin
 * Handles its own state to prevent parent re-renders
 */
export function UsersManagement() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBanned, setFilterBanned] = useState(false);
  const [filterAdmin, setFilterAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        search: searchQuery || undefined,
        banned_only: filterBanned,
        admin_only: filterAdmin,
        limit: 100,
      });
      setUsers(response.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterBanned, filterAdmin, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanUser = async (
    userId: string,
    reason: string,
    durationDays?: number
  ) => {
    const userData = users.find((u) => u.id === userId);
    if (!userData) return;

    try {
      await adminAPI.banUser(userId, {
        reason,
        duration_days: durationDays,
      });
      showSuccess(`User ${userData.username} has been banned.`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to ban user:", error);
      showError("Failed to ban user.");
      throw error;
    }
  };

  const handleUnbanUser = async (userId: string, username: string) => {
    try {
      await adminAPI.unbanUser(userId);
      showSuccess(`User ${username} has been unbanned.`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to unban user:", error);
      showError("Failed to unban user.");
    }
  };

  const handleToggleAdmin = async (
    userId: string,
    username: string,
    isAdmin: boolean
  ) => {
    try {
      if (isAdmin) {
        await adminAPI.removeAdmin(userId);
        showSuccess(`Admin privileges removed from ${username}.`);
      } else {
        await adminAPI.makeAdmin(userId);
        showSuccess(`Admin privileges granted to ${username}.`);
      }
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
      showError("Failed to update admin status.");
    }
  };

  const columns = [
    {
      key: "user",
      header: "User",
      render: (userData: AdminUser) => (
        <div>
          <div className="font-semibold">{userData.username}</div>
          <div className="text-sm text-secondary">{userData.email}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (userData: AdminUser) => (
        <div className="flex flex-col gap-1">
          {userData.is_admin && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs w-fit">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          )}
          {userData.is_banned ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs w-fit">
              <Ban className="w-3 h-3" />
              Banned
            </span>
          ) : userData.is_muffled ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs w-fit">
              <AlertTriangle className="w-3 h-3" />
              Muffled
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "echoes",
      header: "Echoes",
      render: (userData: AdminUser) => <span>{userData.echoes}</span>,
    },
    {
      key: "joinDate",
      header: "Join Date",
      render: (userData: AdminUser) => (
        <div className="text-sm">
          {new Date(userData.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (userData: AdminUser) => (
        <div className="flex gap-2">
          {userData.is_banned ? (
            <button
              onClick={() => handleUnbanUser(userData.id, userData.username)}
              className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500 rounded hover:bg-green-500/30 transition-colors text-sm"
            >
              Unban
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedUser(userData);
                setShowBanModal(true);
              }}
              className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500 rounded hover:bg-red-500/30 transition-colors text-sm"
            >
              Ban
            </button>
          )}

          {userData.id !== user?.id && (
            <button
              onClick={() =>
                handleToggleAdmin(
                  userData.id,
                  userData.username,
                  userData.is_admin
                )
              }
              className={`px-3 py-1 border rounded hover:opacity-80 transition-colors text-sm ${
                userData.is_admin
                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500"
                  : "bg-blue-500/20 text-blue-300 border-blue-500"
              }`}
            >
              {userData.is_admin ? "Remove Admin" : "Make Admin"}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              onChange={setSearchQuery}
              placeholder="Search users..."
            />
          </div>

          <div className="flex gap-2">
            <FilterToggle
              label="Banned Only"
              icon={<Ban className="w-4 h-4" />}
              active={filterBanned}
              onClick={() => setFilterBanned(!filterBanned)}
              activeColor="red"
            />

            <FilterToggle
              label="Admins Only"
              icon={<Shield className="w-4 h-4" />}
              active={filterAdmin}
              onClick={() => setFilterAdmin(!filterAdmin)}
              activeColor="blue"
            />
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl overflow-hidden"
      >
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="No users found"
          rowKey={(u) => u.id}
        />
      </motion.div>

      {/* Ban Modal */}
      <BanUserModal
        isOpen={showBanModal}
        onClose={() => {
          setShowBanModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onBan={handleBanUser}
      />
    </div>
  );
}
