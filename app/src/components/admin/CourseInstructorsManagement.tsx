"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { adminAPI, CourseInstructorDetail, AdminCourse, AdminProfessor } from "@/lib/admin-api";
import { useToast } from "@/providers/ToastProvider";
import { Select, EmptyState, Modal, Pagination } from "@/components/ui";
import Loader from "@/components/common/Loader";

interface EditModalProps {
  instructor: CourseInstructorDetail | null;
  onClose: () => void;
  onSave: (id: string, data: { semester?: string; year?: number }) => Promise<void>;
}

function EditModal({ instructor, onClose, onSave }: EditModalProps) {
  const [semester, setSemester] = useState(instructor?.semester || "");
  const [year, setYear] = useState(instructor?.year?.toString() || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (instructor) {
      setSemester(instructor.semester || "");
      setYear(instructor.year?.toString() || "");
    }
  }, [instructor]);

  const handleSave = async () => {
    if (!instructor) return;
    setSaving(true);
    try {
      await onSave(instructor.id, {
        semester: semester || undefined,
        year: year ? parseInt(year, 10) : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <Modal isOpen={!!instructor} onClose={onClose} title="Edit Course Instructor">
      <div className="space-y-4">
        {instructor && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-medium">{instructor.course.code}</span>
              <span className="text-secondary">{instructor.course.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>{instructor.professor.name}</span>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">Semester</label>
          <Select
            value={semester}
            onChange={setSemester}
            placeholder="Select semester"
            options={[
              { value: "", label: "Any semester" },
              { value: "MONSOON", label: "Monsoon" },
              { value: "SPRING", label: "Spring" },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Year</label>
          <Select
            value={year}
            onChange={setYear}
            placeholder="Select year"
            options={[
              { value: "", label: "Any year" },
              ...years.map((y) => ({ value: y.toString(), label: y.toString() })),
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { course_id: string; professor_id: string; semester?: string; year?: number }) => Promise<void>;
  courses: AdminCourse[];
  professors: AdminProfessor[];
}

function AddModal({ isOpen, onClose, onAdd, courses, professors }: AddModalProps) {
  const [courseId, setCourseId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await onAdd({
        course_id: courseId,
        professor_id: professorId,
        semester: semester || undefined,
        year: year ? parseInt(year, 10) : undefined,
      });
      setCourseId("");
      setProfessorId("");
      setSemester("");
      setYear("");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Course Instructor Link">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Course *</label>
          <Select
            value={courseId}
            onChange={setCourseId}
            placeholder="Select a course"
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.code} - ${c.name}`,
            }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Professor *</label>
          <Select
            value={professorId}
            onChange={setProfessorId}
            placeholder="Select a professor"
            options={professors.map((p) => ({
              value: p.id,
              label: p.lab ? `${p.name} (${p.lab})` : p.name,
            }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Semester</label>
            <Select
              value={semester}
              onChange={setSemester}
              placeholder="Any"
              options={[
                { value: "", label: "Any semester" },
                { value: "MONSOON", label: "Monsoon" },
                { value: "SPRING", label: "Spring" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <Select
              value={year}
              onChange={setYear}
              placeholder="Any"
              options={[
                { value: "", label: "Any year" },
                ...years.map((y) => ({ value: y.toString(), label: y.toString() })),
              ]}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-secondary hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !courseId || !professorId}
            className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Link"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function CourseInstructorsManagement() {
  const { showSuccess, showError } = useToast();
  const [courseInstructors, setCourseInstructors] = useState<CourseInstructorDetail[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [professors, setProfessors] = useState<AdminProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<CourseInstructorDetail | null>(null);

  // Filters
  const [filterCourseId, setFilterCourseId] = useState<string>("");
  const [filterProfessorId, setFilterProfessorId] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ciRes, coursesRes, profsRes] = await Promise.all([
        adminAPI.getCourseInstructors({
          course_id: filterCourseId || undefined,
          professor_id: filterProfessorId || undefined,
        }),
        adminAPI.getCourses({ limit: 500 }),
        adminAPI.getProfessors({ limit: 500 }),
      ]);
      setCourseInstructors(ciRes.course_instructors);
      setCourses(coursesRes.courses);
      setProfessors(profsRes.professors);
    } catch {
      showError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filterCourseId, filterProfessorId, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (data: { course_id: string; professor_id: string; semester?: string; year?: number }) => {
    try {
      await adminAPI.createCourseInstructor(data);
      showSuccess("Course instructor link created");
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create link";
      showError(message);
      throw error;
    }
  };

  const handleEdit = async (id: string, data: { semester?: string; year?: number }) => {
    try {
      await adminAPI.updateCourseInstructor({ id, ...data });
      showSuccess("Course instructor updated");
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      showError(message);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this course-professor link?")) {
      return;
    }
    try {
      await adminAPI.deleteCourseInstructor(id);
      showSuccess("Link removed");
      fetchData();
    } catch {
      showError("Failed to remove link");
    }
  };

  // Pagination logic
  const paginatedItems = courseInstructors.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(courseInstructors.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header Card with Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Course Instructors</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Filter by Course</label>
            <Select
              value={filterCourseId}
              onChange={(value) => { setFilterCourseId(value); setPage(1); }}
              placeholder="All Courses"
              options={[
                { value: "", label: "All Courses" },
                ...courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-2">Filter by Professor</label>
            <Select
              value={filterProfessorId}
              onChange={(value) => { setFilterProfessorId(value); setPage(1); }}
              placeholder="All Professors"
              options={[
                { value: "", label: "All Professors" },
                ...professors.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : courseInstructors.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No course-instructor links found"
          description={filterCourseId || filterProfessorId ? "Try adjusting your filters" : "Add your first course-professor link"}
        />
      ) : (
        <>
          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-secondary">Course</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-secondary">Professor</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-secondary">Semester</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-secondary">Year</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {paginatedItems.map((ci) => (
                      <motion.tr
                        key={ci.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                            <div>
                              <span className="font-medium">{ci.course.code}</span>
                              <span className="text-secondary ml-2 text-sm hidden sm:inline">{ci.course.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" />
                            <span>{ci.professor.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={ci.semester ? "text-foreground" : "text-secondary"}>
                            {ci.semester || "Any"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={ci.year ? "text-foreground" : "text-secondary"}>
                            {ci.year || "Any"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingInstructor(ci)}
                              className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ci.id)}
                              className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Modals */}
      <AddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
        courses={courses}
        professors={professors}
      />
      <EditModal
        instructor={editingInstructor}
        onClose={() => setEditingInstructor(null)}
        onSave={handleEdit}
      />
    </div>
  );
}
