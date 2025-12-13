"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { adminAPI, AdminCourse } from "@/lib/admin-api";
import { useToast } from "@/providers/ToastProvider";
import { SearchInput, EmptyState, Modal, Pagination } from "@/components/ui";
import Loader from "@/components/common/Loader";

const PAGE_SIZE = 20;

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

export function CoursesManagement() {
  const { showSuccess, showError } = useToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<AdminCourse | null>(null);

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

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6"
      >
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
