"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useCourses } from "@/hooks/useData";
import { CourseCard } from "./CourseCard";
import { SearchInput, SortSelector, EmptyState, ResultsCount, Select, Pagination } from "@/components/ui";
import Loader from "@/components/common/Loader";

const PAGE_SIZE = 21; // 7 rows of 3 cards

/**
 * Courses list with server-side filtering and numbered pagination
 */
export function CoursesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [sortBy, setSortBy] = useState("code");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSemester, selectedYear]);

  const { courses, total, isLoading, isError, mutate } = useCourses({
    skip: (currentPage - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    semester: selectedSemester,
    year: selectedYear,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Sort client-side
  const sortedCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    return [...courses].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return parseFloat(b.average_rating) - parseFloat(a.average_rating);
        case "reviews":
          return b.review_count - a.review_count;
        case "name":
          return a.name.localeCompare(b.name);
        case "code":
        default:
          return a.code.localeCompare(b.code);
      }
    });
  }, [courses, sortBy]);

  if (isError) {
    return (
      <EmptyState
        icon={<BookOpen className="w-16 h-16" />}
        title="Error Loading Courses"
        description="Failed to load courses. Please try again later."
        action={{
          label: "Try Again",
          onClick: () => mutate(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SearchInput
              onChange={setSearchQuery}
              placeholder="Search courses..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Select
              value={selectedSemester}
              onChange={setSelectedSemester}
              options={[
                { value: "ALL", label: "All Semesters" },
                { value: "SPRING", label: "Spring" },
                { value: "MONSOON", label: "Monsoon" },
              ]}
              className="flex-1"
            />

            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={[
                { value: "ALL", label: "All Years" },
                { value: "2025", label: "2025" },
                { value: "2024", label: "2024" },
                { value: "2023", label: "2023" },
                { value: "2022", label: "2022" },
              ]}
              className="flex-1"
            />
          </div>
        </div>
      </motion.div>

      {/* Sort Options and Results Count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0"
      >
        <SortSelector
          options={["code", "rating", "reviews", "name"]}
          selected={sortBy}
          onChange={setSortBy}
        />
        <ResultsCount count={total} singular="course" />
      </motion.div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="mx-auto mb-4" />
            <p className="text-secondary">Loading courses...</p>
          </div>
        </div>
      ) : sortedCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-16 h-16" />}
          title="No courses found"
          description="Try adjusting your search criteria or filters"
        />
      ) : (
        <>
          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * Math.min(index, 6) }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
