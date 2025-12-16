"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { adminAPI, AdminEmail } from "@/lib/admin-api";
import { useToast } from "@/providers/ToastProvider";
import { SearchInput, EmptyState, Modal, Pagination } from "@/components/ui";
import Loader from "@/components/common/Loader";

interface AddEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string) => Promise<void>;
}

function AddEmailModal({ isOpen, onClose, onAdd }: AddEmailModalProps) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await onAdd(email);
      setEmail("");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Email">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">IIITH Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@iiit.ac.in"
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-sm text-secondary mt-2">
            Must end with @iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={handleClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !email.trim()}
            className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Email"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const PAGE_SIZE = 20;

export function EmailsManagement() {
  const { showSuccess, showError } = useToast();
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<AdminEmail | null>(null);

  const fetchEmails = useCallback(async () => {
    if (!initialLoading) {
      setRefreshing(true);
    }
    try {
      const result = await adminAPI.getEmails({
        search: searchQuery,
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setEmails(result.emails);
      setTotal(result.total);
    } catch (error) {
      showError("Failed to load emails");
      console.error(error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, currentPage, showError, initialLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleAdd = async (email: string) => {
    try {
      await adminAPI.addEmail(email);
      showSuccess("Email added successfully");
      fetchEmails();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add email";
      showError(message);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingEmail) return;
    try {
      await adminAPI.deleteEmail(deletingEmail.id);
      showSuccess("Email deleted successfully");
      setDeletingEmail(null);
      fetchEmails();
    } catch (error) {
      showError("Failed to delete email");
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
      {/* Search and Add */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Registered IIITH Emails</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Email
          </button>
        </div>
        <SearchInput
          onChange={setSearchQuery}
          placeholder="Search emails..."
        />
        <p className="text-sm text-secondary mt-2">
          Total: {total} registered email{total !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Emails Table */}
      <div className="relative">
        {refreshing && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
            <Loader />
          </div>
        )}
        {emails.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-primary/20 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Added</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr key={email.id} className="border-b border-border/50 hover:bg-background/20">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-secondary" />
                          <span className="font-medium">{email.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {email.verified_at ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                            <XCircle className="w-3 h-3" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-secondary">
                        {new Date(email.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setDeletingEmail(email)}
                          className="p-2 text-secondary hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
            icon={<Mail className="w-16 h-16" />}
            title="No emails found"
            description={searchQuery ? "Try adjusting your search criteria" : "Add your first IIITH email to get started"}
          />
        )}
      </div>

      {/* Add Email Modal */}
      <AddEmailModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingEmail && (
          <Modal
            isOpen={!!deletingEmail}
            onClose={() => setDeletingEmail(null)}
            title="Delete Email"
          >
            <div className="space-y-4">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-medium">{deletingEmail.email}</span>?
              </p>
              <p className="text-sm text-secondary">
                {deletingEmail.verified_at 
                  ? "This email has been used for verification. Deleting it will allow someone else to use it."
                  : "This email has not been verified yet."}
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setDeletingEmail(null)}
                  className="px-4 py-2 text-secondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
