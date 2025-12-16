"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Pencil, Trash2, GitMerge, Plus, X, GraduationCap, ChevronDown } from "lucide-react";
import { adminAPI, AdminCourse, AdminProfessor } from "@/lib/admin-api";
import { useToast } from "@/providers/ToastProvider";
import { SearchInput, EmptyState, Modal, Pagination, Select } from "@/components/ui";
import Loader from "@/components/common/Loader";

const PAGE_SIZE = 20;

// Professor chip selector component
interface ProfessorChipSelectorProps {
  selectedProfessors: AdminProfessor[];
  onAdd: (professor: AdminProfessor) => void;
  onRemove: (professorId: string) => void;
  allProfessors: AdminProfessor[];
  loading?: boolean;
}

function ProfessorChipSelector({ selectedProfessors, onAdd, onRemove, allProfessors, loading }: ProfessorChipSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableProfessors = allProfessors.filter(
    (p) => !selectedProfessors.find((sp) => sp.id === p.id) &&
           (p.name.toLowerCase().includes(search.toLowerCase()) || 
            (p.lab?.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="space-y-2">
      {/* Selected professors chips */}
      {selectedProfessors.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-input border border-border rounded-lg min-h-[40px]">
          {selectedProfessors.map((prof) => (
            <span
              key={prof.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
            >
              <GraduationCap className="w-3 h-3" />
              {prof.name}
              <button
                onClick={() => onRemove(prof.id)}
                className="ml-1 hover:text-red-400 transition-colors"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-3 px-4 bg-input border border-border rounded-lg flex items-center justify-between hover:border-primary/50 transition-colors"
        >
          <span className="text-secondary">
            {loading ? "Loading professors..." : "Add a professor..."}
          </span>
          <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-hidden"
            >
              <div className="p-2 border-b border-border">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search professors..."
                  className="w-full py-2 px-3 bg-input border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-48">
                {availableProfessors.length > 0 ? (
                  availableProfessors.slice(0, 50).map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => {
                        onAdd(prof);
                        setSearch("");
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-primary/10 transition-colors flex items-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4 text-secondary" />
                      <div>
                        <p className="font-medium">{prof.name}</p>
                        {prof.lab && <p className="text-xs text-secondary">{prof.lab}</p>}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-secondary text-center">
                    {search ? "No professors found" : "All professors selected"}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CourseEditModalProps {
  course: AdminCourse | null;
  onClose: () => void;
  onSave: (id: string, data: { code: string; name: string; credits?: number; description?: string }) => Promise<void>;
}

function CourseEditModal({ course, onClose, onSave }: CourseEditModalProps) {
  const [code, setCode] = useState(course?.code || "");
  const [name, setName] = useState(course?.name || "");
  const [credits, setCredits] = useState<string>(course?.credits?.toString() || "");
  const [description, setDescription] = useState(course?.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setCode(course.code);
      setName(course.name);
      setCredits(course.credits?.toString() || "");
      setDescription(course.description || "");
    }
  }, [course]);

  const handleSave = async () => {
    if (!course) return;
    setSaving(true);
    try {
      await onSave(course.id, {
        code,
        name,
        credits: credits ? parseInt(credits) : undefined,
        description: description || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={!!course} onClose={onClose} title="Edit Course">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Course Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Course Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Credits</label>
          <input
            type="number"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            min="0"
            max="12"
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !code.trim() || !name.trim()}
            className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface CourseAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { code: string; name: string; credits?: number; description?: string; professorIds?: string[] }) => Promise<void>;
  professors: AdminProfessor[];
  loadingProfessors: boolean;
}

function CourseAddModal({ isOpen, onClose, onAdd, professors, loadingProfessors }: CourseAddModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProfessors, setSelectedProfessors] = useState<AdminProfessor[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await onAdd({
        code,
        name,
        credits: credits ? parseInt(credits) : undefined,
        description: description || undefined,
        professorIds: selectedProfessors.map(p => p.id),
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setName("");
    setCredits("");
    setDescription("");
    setSelectedProfessors([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Course">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Course Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CS2030"
              className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Credits</label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="4"
              min="0"
              max="12"
              className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Course Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Data Structures and Algorithms"
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Instructors (optional)</label>
          <ProfessorChipSelector
            selectedProfessors={selectedProfessors}
            onAdd={(prof) => setSelectedProfessors((prev) => [...prev, prof])}
            onRemove={(id) => setSelectedProfessors((prev) => prev.filter((p) => p.id !== id))}
            allProfessors={professors}
            loading={loadingProfessors}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief course description..."
            className="w-full py-3 px-4 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={handleClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !code.trim() || !name.trim()}
            className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Course"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface CourseMergeModalProps {
  canonical: AdminCourse | null;
  courses: AdminCourse[];
  onClose: () => void;
  onMerge: (canonicalId: string, variantId: string) => Promise<void>;
}

function CourseMergeModal({ canonical, courses, onClose, onMerge }: CourseMergeModalProps) {
  const [variantId, setVariantId] = useState("");
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    setVariantId("");
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

  const availableCourses = courses.filter((c) => c.id !== canonical?.id);
  const variant = courses.find((c) => c.id === variantId);

  return (
    <Modal isOpen={!!canonical} onClose={onClose} title="Merge Courses">
      <div className="space-y-4">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-sm text-secondary mb-1">Keep (Canonical)</p>
          <p className="font-semibold">{canonical?.code} - {canonical?.name}</p>
          <p className="text-sm text-secondary">
            {canonical?.review_count} reviews • {canonical?.instructors_count || 0} instructors
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Select course to merge into above
          </label>
          <Select
            value={variantId}
            onChange={setVariantId}
            placeholder="Select a course to merge..."
            options={availableCourses.map((c) => ({
              value: c.id,
              label: `${c.code} - ${c.name}`,
            }))}
          />
        </div>

        {variant && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-400 mb-1">Will be deleted</p>
            <p className="font-semibold">{variant.code} - {variant.name}</p>
            <p className="text-sm text-secondary">
              {variant.review_count} reviews • {variant.instructors_count || 0} instructors
            </p>
            <p className="text-sm text-yellow-400 mt-2">
              ⚠ All reviews and instructors will be transferred to {canonical?.code}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={merging || !variantId}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {merging ? "Merging..." : "Merge Courses"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function CoursesManagement() {
  const { showSuccess, showError } = useToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [professors, setProfessors] = useState<AdminProfessor[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingProfessors, setLoadingProfessors] = useState(false);
  
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [mergingCourse, setMergingCourse] = useState<AdminCourse | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<AdminCourse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (!initialLoading) {
      setRefreshing(true);
    }
    try {
      const result = await adminAPI.getCourses({
        search: searchQuery,
        skip: (currentPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setCourses(result.courses);
      setTotal(result.total);
    } catch (error) {
      showError("Failed to load courses");
      console.error(error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, currentPage, showError, initialLoading]);

  const fetchProfessors = useCallback(async () => {
    setLoadingProfessors(true);
    try {
      const result = await adminAPI.getProfessors({ limit: 500 });
      setProfessors(result.professors);
    } catch (error) {
      console.error("Failed to load professors:", error);
    } finally {
      setLoadingProfessors(false);
    }
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Load professors when add modal opens
  useEffect(() => {
    if (showAddModal && professors.length === 0) {
      fetchProfessors();
    }
  }, [showAddModal, professors.length, fetchProfessors]);

  const handleEdit = async (id: string, data: { code: string; name: string; credits?: number; description?: string }) => {
    try {
      await adminAPI.updateCourse(id, data);
      showSuccess("Course updated successfully");
      fetchCourses();
    } catch (error) {
      showError("Failed to update course");
      throw error;
    }
  };

  const handleAdd = async (data: { code: string; name: string; credits?: number; description?: string; professorIds?: string[] }) => {
    try {
      await adminAPI.createCourse({
        code: data.code,
        name: data.name,
        credits: data.credits,
        description: data.description,
        professor_ids: data.professorIds,
      });
      showSuccess("Course added successfully");
      fetchCourses();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add course";
      showError(message);
      throw error;
    }
  };

  const handleMerge = async (canonicalId: string, variantId: string) => {
    try {
      const result = await adminAPI.mergeCourses({
        canonical_id: canonicalId,
        variant_id: variantId,
      });
      showSuccess(result.message);
      fetchCourses();
    } catch (error) {
      showError("Failed to merge courses");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;
    try {
      await adminAPI.deleteCourse(deletingCourse.id);
      showSuccess("Course deleted successfully");
      setDeletingCourse(null);
      fetchCourses();
    } catch (error) {
      showError("Failed to delete course");
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
          <h2 className="text-lg font-semibold">Courses</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
        <SearchInput
          onChange={setSearchQuery}
          placeholder="Search by course code or name..."
        />
      </motion.div>

      {/* Courses Table */}
      <div className="relative">
        {refreshing && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
            <Loader />
          </div>
        )}
        {courses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-primary/20 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="text-left p-4 font-semibold">Code</th>
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Instructors</th>
                    <th className="text-left p-4 font-semibold">Reviews</th>
                    <th className="text-left p-4 font-semibold">Rating</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-border/50 hover:bg-background/20">
                      <td className="p-4">
                        <span className="font-mono text-primary">{course.code}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{course.name}</p>
                          {course.credits && (
                            <p className="text-sm text-secondary">{course.credits} credits</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{course.instructors_count || 0}</td>
                      <td className="p-4">{course.review_count}</td>
                      <td className="p-4">{parseFloat(course.average_rating).toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingCourse(course)}
                            className="p-2 text-secondary hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setMergingCourse(course)}
                            className="p-2 text-secondary hover:text-orange-500 transition-colors"
                            title="Merge"
                          >
                            <GitMerge className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCourse(course)}
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
            icon={<BookOpen className="w-16 h-16" />}
            title="No courses found"
            description="Try adjusting your search criteria"
          />
        )}
      </div>

      {/* Edit Modal */}
      <CourseEditModal
        course={editingCourse}
        onClose={() => setEditingCourse(null)}
        onSave={handleEdit}
      />

      {/* Add Modal */}
      <CourseAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
        professors={professors}
        loadingProfessors={loadingProfessors}
      />

      {/* Merge Modal */}
      <CourseMergeModal
        canonical={mergingCourse}
        courses={courses}
        onClose={() => setMergingCourse(null)}
        onMerge={handleMerge}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCourse && (
          <Modal
            isOpen={!!deletingCourse}
            onClose={() => setDeletingCourse(null)}
            title="Delete Course"
          >
            <div className="space-y-4">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-medium">{deletingCourse.code} - {deletingCourse.name}</span>?
              </p>
              <p className="text-sm text-red-400">
                This will also delete all associated reviews and instructor assignments.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setDeletingCourse(null)}
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
