"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Ban,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { adminAPI } from "@/lib/admin-api";
import { AdminUser } from "@/types/admin-models";
import Loader from "@/components/common/Loader";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBanned, setFilterBanned] = useState(false);
  const [filterAdmin, setFilterAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | undefined>(undefined);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersData = await adminAPI.getUsers({
        search: searchQuery || undefined,
        banned_only: filterBanned,
        admin_only: filterAdmin,
        limit: 100,
      });
      setUsers(usersData);
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

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return;

    try {
      await adminAPI.banUser(selectedUser.id, {
        reason: banReason,
        duration_days: banDuration,
      });

      showSuccess(`User ${selectedUser.username} has been banned.`);
      setShowBanModal(false);
      setSelectedUser(null);
      setBanReason("");
      setBanDuration(undefined);
      fetchUsers();
    } catch (error) {
      console.error("Failed to ban user:", error);
      showError("Failed to ban user.");
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

  if (!user || !(user as { is_admin?: boolean }).is_admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-secondary">
            Manage user accounts, bans, and permissions
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterBanned(!filterBanned)}
                className={`px-4 py-2 rounded-lg border transition-colors ${filterBanned
                    ? "bg-red-500/20 border-red-500 text-red-300"
                    : "bg-background/50 border-border hover:border-primary"
                  }`}
              >
                <Ban className="w-4 h-4 inline mr-2" />
                Banned Only
              </button>

              <button
                onClick={() => setFilterAdmin(!filterAdmin)}
                className={`px-4 py-2 rounded-lg border transition-colors ${filterAdmin
                    ? "bg-blue-500/20 border-blue-500 text-blue-300"
                    : "bg-background/50 border-border hover:border-primary"
                  }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Admins Only
              </button>
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
          {loading ? (
            <div className="p-8 text-center">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">User</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Echoes</th>
                    <th className="text-left p-4 font-semibold">Join Date</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr
                      key={userData.id}
                      className="border-b border-border/50 hover:bg-background/20"
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-semibold">
                            {userData.username}
                          </div>
                          <div className="text-sm text-secondary">
                            {userData.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {userData.is_admin && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          {userData.is_banned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                              <Ban className="w-3 h-3" />
                              Banned
                            </span>
                          ) : userData.is_muffled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              Muffled
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4">{userData.echoes}</td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(userData.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {userData.is_banned ? (
                            <button
                              onClick={() =>
                                handleUnbanUser(userData.id, userData.username)
                              }
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

                          {userData.id !== user.id && (
                            <button
                              onClick={() => handleToggleAdmin(userData.id, userData.username, userData.is_admin)}
                              className={`px-3 py-1 border rounded hover:opacity-80 transition-colors text-sm ${userData.is_admin
                                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500"
                                  : "bg-blue-500/20 text-blue-300 border-blue-500"
                                }`}
                            >
                              {userData.is_admin
                                ? "Remove Admin"
                                : "Make Admin"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Ban Modal */}
        {showBanModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-primary/20 rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Ban User: {selectedUser.username}</h2>

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
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setSelectedUser(null);
                    setBanReason("");
                    setBanDuration(undefined);
                  }}
                  className="flex-1 px-4 py-2 bg-background/50 border border-border rounded-lg hover:border-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={!banReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
