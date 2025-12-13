"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldOff, UserPlus, Search, User } from "lucide-react";
import { adminAPI, AdminUser } from "@/lib/admin-api";
import { useToast } from "@/providers/ToastProvider";
import { SearchInput, EmptyState, Modal, Pagination } from "@/components/ui";
import Loader from "@/components/common/Loader";

const PAGE_SIZE = 20;

export function AdminsManagement() {
  const { showSuccess, showError } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState<AdminUser | null>(null);

  const fetchAdmins = useCallback(async () => {
    if (!initialLoading) {
      setRefreshing(true);
    }
    try {
      const result = await adminAPI.getUsers({
        search: searchQuery,
        admin_only: true,
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setAdmins(result.users);
      setTotal(result.total);
    } catch (error) {
      showError("Failed to load admins");
      console.error(error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, currentPage, showError, initialLoading]);

  // Search users to add as admin
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAllUsers([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const result = await adminAPI.getUsers({
        search: query,
        limit: 10,
      });
      // Filter out users who are already admins
      setAllUsers(result.users.filter((u: AdminUser) => !u.is_admin));
    } catch (error) {
      console.error(error);
    } finally {
      setSearchingUsers(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, searchUsers]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleMakeAdmin = async (userId: string) => {
    try {
      await adminAPI.makeAdmin(userId);
      showSuccess("Admin privileges granted");
      setShowAddModal(false);
      setUserSearchQuery("");
      setAllUsers([]);
      fetchAdmins();
    } catch (error) {
      showError("Failed to grant admin privileges");
      console.error(error);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!removingAdmin) return;
    try {
      await adminAPI.removeAdmin(removingAdmin.id);
      showSuccess("Admin privileges removed");
      setRemovingAdmin(null);
      fetchAdmins();
    } catch (error) {
      showError("Failed to remove admin privileges");
      console.error(error);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Admin */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              onChange={setSearchQuery}
              placeholder="Search admins..."
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Admin</span>
          </button>
        </div>
      </motion.div>

      {/* Admins List */}
      <div className="relative">
        {refreshing && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
            <Loader />
          </div>
        )}
        {admins.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-primary/20 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="text-left p-4 font-semibold">Admin</th>
                    <th className="text-left p-4 font-semibold hidden lg:table-cell">Joined</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-border/50 hover:bg-background/20">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{admin.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-secondary text-sm">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setRemovingAdmin(admin)}
                          className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove admin privileges"
                        >
                          <ShieldOff className="w-4 h-4" />
                          <span className="hidden sm:inline text-sm">Remove</span>
                        </button>
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
            icon={<Shield className="w-16 h-16" />}
            title="No admins found"
            description={searchQuery ? "Try adjusting your search" : "Add your first admin user"}
          />
        )}
      </div>

      {/* Add Admin Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setUserSearchQuery(""); setAllUsers([]); }} title="Add Admin">
        <div className="space-y-4">
          <p className="text-secondary text-sm">
            Search for a user to grant admin privileges.
          </p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full py-3 pl-10 pr-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {searchingUsers && (
            <div className="flex justify-center py-4">
              <Loader />
            </div>
          )}

          {allUsers.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMakeAdmin(user.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black text-sm rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Shield className="w-3 h-3" />
                    Make Admin
                  </button>
                </div>
              ))}
            </div>
          )}

          {userSearchQuery && !searchingUsers && allUsers.length === 0 && (
            <p className="text-center text-secondary py-4">
              No users found matching &quot;{userSearchQuery}&quot;
            </p>
          )}
        </div>
      </Modal>

      {/* Remove Admin Confirmation Modal */}
      <AnimatePresence>
        {removingAdmin && (
          <Modal
            isOpen={!!removingAdmin}
            onClose={() => setRemovingAdmin(null)}
            title="Remove Admin"
          >
            <div className="space-y-4">
              <p>
                Are you sure you want to remove admin privileges from{" "}
                <span className="font-medium">{removingAdmin.username}</span>?
              </p>
              <p className="text-sm text-secondary">
                They will no longer have access to admin features.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setRemovingAdmin(null)}
                  className="px-4 py-2 text-secondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveAdmin}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  <ShieldOff className="w-4 h-4" />
                  Remove Admin
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
