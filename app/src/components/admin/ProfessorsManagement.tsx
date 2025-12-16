"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Pencil, Trash2, GitMerge, AlertTriangle, Plus } from "lucide-react";
import { adminAPI, AdminProfessor } from "@/lib/admin-api";
import { useToast } from "@/providers/ToastProvider";
import { SearchInput, Select, EmptyState, Modal, Pagination } from "@/components/ui";
import Loader from "@/components/common/Loader";

interface ProfessorEditModalProps {
  professor: AdminProfessor | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; lab: string }) => Promise<void>;
  labs: string[];
}

function ProfessorEditModal({ professor, onClose, onSave, labs }: ProfessorEditModalProps) {
  const [name, setName] = useState(professor?.name || "");
  const [lab, setLab] = useState(professor?.lab || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (professor) {
      setName(professor.name);
      setLab(professor.lab || "");
    }
  }, [professor]);

  const handleSave = async () => {
    if (!professor) return;
    setSaving(true);
    try {
      await onSave(professor.id, { name, lab });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={!!professor} onClose={onClose} title="Edit Professor">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Lab</label>
          <Select
            value={lab}
            onChange={setLab}
            placeholder="Select a lab or leave empty"
            options={[
              { value: "", label: "No lab" },
              ...labs.map((l) => ({ value: l, label: l })),
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ProfessorAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; lab: string }) => Promise<void>;
  labs: string[];
}

function ProfessorAddModal({ isOpen, onClose, onAdd, labs }: ProfessorAddModalProps) {
  const [name, setName] = useState("");
  const [lab, setLab] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await onAdd({ name, lab });
      setName("");
      setLab("");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setLab("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Professor">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Professor's full name"
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Lab (optional)</label>
          <Select
            value={lab}
            onChange={setLab}
            placeholder="Select a lab or leave empty"
            options={[
              { value: "", label: "No lab" },
              ...labs.map((l) => ({ value: l, label: l })),
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={handleClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Professor"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ProfessorMergeModalProps {
  canonical: AdminProfessor | null;
  professors: AdminProfessor[];
  onClose: () => void;
  onMerge: (canonicalId: string, variantId: string) => Promise<void>;
}

function ProfessorMergeModal({ canonical, professors, onClose, onMerge }: ProfessorMergeModalProps) {
  const [variantId, setVariantId] = useState("");
  const [preview, setPreview] = useState<{
    courses_to_transfer: number;
    reviews_to_transfer: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!canonical || !variantId) return;
    setLoading(true);
    try {
      const result = await adminAPI.previewMerge(canonical.id, variantId);
      setPreview(result);
    } catch {
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [canonical, variantId]);

  useEffect(() => {
    if (variantId) {
      loadPreview();
    } else {
      setPreview(null);
    }
  }, [variantId, loadPreview]);

  useEffect(() => {
    if (!canonical) {
      setVariantId("");
      setPreview(null);
    }
  }, [canonical]);

  const handleMerge = async () => {
    if (!canonical || !variantId) return;
    setMerging(true);
    try {
      await onMerge(canonical.id, variantId);
      onClose();
    } finally {
      setMerging(false);
    }
  };

  const variant = professors.find((p) => p.id === variantId);

  return (
    <Modal isOpen={!!canonical} onClose={onClose} title="Merge Professors">
      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-500">This action is irreversible</p>
              <p className="text-sm text-secondary mt-1">
                The variant professor will be deleted and all their courses and reviews will be transferred to the canonical professor.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Keep (Canonical)</label>
          <div className="p-3 bg-input border border-primary/30 rounded-lg">
            <p className="font-medium">{canonical?.name}</p>
            <p className="text-sm text-secondary">{canonical?.lab || "No lab"}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Merge Into (Variant to delete)</label>
          <Select
            value={variantId}
            onChange={setVariantId}
            placeholder="Select professor to merge..."
            options={professors
              .filter((p) => p.id !== canonical?.id)
              .map((p) => ({
                value: p.id,
                label: `${p.name}${p.lab ? ` (${p.lab})` : ""}`,
              }))}
          />
        </div>

        {loading && (
          <div className="text-center py-4">
            <Loader />
          </div>
        )}

        {preview && variant && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium mb-2">Preview</h4>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-secondary">Courses to transfer:</span>{" "}
                <span className="font-medium">{preview.courses_to_transfer}</span>
              </p>
              <p>
                <span className="text-secondary">Reviews to transfer:</span>{" "}
                <span className="font-medium">{preview.reviews_to_transfer}</span>
              </p>
              <p className="text-red-400 mt-3">
                &quot;{variant.name}&quot; will be deleted after merge.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={merging || !variantId || loading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {merging ? "Merging..." : "Confirm Merge"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const PAGE_SIZE = 20;

export function ProfessorsManagement() {
  const { showSuccess, showError } = useToast();
  const [professors, setProfessors] = useState<AdminProfessor[]>([]);
  const [labs, setLabs] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [editingProfessor, setEditingProfessor] = useState<AdminProfessor | null>(null);
  const [mergingProfessor, setMergingProfessor] = useState<AdminProfessor | null>(null);
  const [deletingProfessor, setDeletingProfessor] = useState<AdminProfessor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchProfessors = useCallback(async () => {
    // Only show refreshing indicator after initial load
    if (!initialLoading) {
      setRefreshing(true);
    }
    try {
      const result = await adminAPI.getProfessors({
        search: searchQuery,
        lab: selectedLab !== "ALL" ? selectedLab : undefined,
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setProfessors(result.professors);
      setLabs(result.labs);
      setTotal(result.total);
    } catch (error) {
      showError("Failed to load professors");
      console.error(error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedLab, currentPage, showError, initialLoading]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLab]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  const handleEdit = async (id: string, data: { name: string; lab: string }) => {
    try {
      await adminAPI.updateProfessor(id, data);
      showSuccess("Professor updated successfully");
      fetchProfessors();
    } catch (error) {
      showError("Failed to update professor");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingProfessor) return;
    try {
      await adminAPI.deleteProfessor(deletingProfessor.id);
      showSuccess("Professor deleted successfully");
      setDeletingProfessor(null);
      fetchProfessors();
    } catch (error) {
      showError("Failed to delete professor");
      console.error(error);
    }
  };

  const handleMerge = async (canonicalId: string, variantId: string) => {
    try {
      const result = await adminAPI.mergeProfessors({
        canonical_id: canonicalId,
        variant_id: variantId,
      });
      showSuccess(result.message);
      fetchProfessors();
    } catch (error) {
      showError("Failed to merge professors");
      throw error;
    }
  };

  const handleAdd = async (data: { name: string; lab: string }) => {
    try {
      await adminAPI.createProfessor(data);
      showSuccess("Professor added successfully");
      fetchProfessors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add professor";
      showError(message);
      throw error;
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
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Professors</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Professor
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              onChange={setSearchQuery}
              placeholder="Search professors..."
            />
          </div>
          <Select
            value={selectedLab}
            onChange={setSelectedLab}
            options={[
              { value: "ALL", label: "All Labs" },
              ...labs.map((l) => ({ value: l, label: l })),
            ]}
          />
        </div>
      </motion.div>

      {/* Professors Table */}
      <div className="relative">
        {refreshing && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
            <Loader />
          </div>
        )}
        {professors.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-primary/20 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Courses</th>
                  <th className="text-left p-4 font-semibold">Reviews</th>
                  <th className="text-left p-4 font-semibold">Rating</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {professors.map((prof) => (
                  <tr key={prof.id} className="border-b border-border/50 hover:bg-background/20">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{prof.name}</p>
                        <p className="text-sm text-secondary">{prof.lab || "No lab"}</p>
                      </div>
                    </td>
                    <td className="p-4">{prof.courses_count || 0}</td>
                    <td className="p-4">{prof.review_count}</td>
                    <td className="p-4">{parseFloat(prof.average_rating).toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProfessor(prof)}
                          className="p-2 text-secondary hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setMergingProfessor(prof)}
                          className="p-2 text-secondary hover:text-yellow-500 transition-colors"
                          title="Merge"
                        >
                          <GitMerge className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProfessor(prof)}
                          className="p-2 text-secondary hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
            icon={<GraduationCap className="w-16 h-16" />}
            title="No professors found"
            description="Try adjusting your search criteria"
          />
        )}
      </div>

      {/* Edit Modal */}
      <ProfessorEditModal
        professor={editingProfessor}
        onClose={() => setEditingProfessor(null)}
        onSave={handleEdit}
        labs={labs}
      />

      {/* Merge Modal */}
      <ProfessorMergeModal
        canonical={mergingProfessor}
        professors={professors}
        onClose={() => setMergingProfessor(null)}
        onMerge={handleMerge}
      />

      {/* Add Professor Modal */}
      <ProfessorAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
        labs={labs}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingProfessor && (
          <Modal
            isOpen={!!deletingProfessor}
            onClose={() => setDeletingProfessor(null)}
            title="Delete Professor"
          >
            <div className="space-y-4">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-medium">{deletingProfessor.name}</span>?
              </p>
              <p className="text-sm text-red-400">
                This will also delete all associated reviews and course assignments.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setDeletingProfessor(null)}
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
