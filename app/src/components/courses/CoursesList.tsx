"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useCourses } from "@/hooks/useData";
import { CourseCard } from "./CourseCard";
import { SearchInput, SortSelector, EmptyState, ResultsCount, Select } from "@/components/ui";
import Loader from "@/components/common/Loader";

/**
 * Self-contained courses list component
 * All filter/search state lives here to prevent parent page re-renders
 */
export function CoursesList() {
  const { courses, isLoading, isError, mutate } = useCourses(0, 1000);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [sortBy, setSortBy] = useState("rating");

  // Filter and sort logic - memoized
  const filteredAndSortedCourses = useMemo(() => {
    const filtered = courses.filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSemester =
        selectedSemester === "ALL" ||
        (course.course_instructors &&
          course.course_instructors.some((ci) => ci.semester === selectedSemester));

      const matchesYear =
        selectedYear === "ALL" ||
        (course.course_instructors &&
          course.course_instructors.some((ci) => String(ci.year) === selectedYear));

      return matchesSearch && matchesSemester && matchesYear;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return parseFloat(b.average_rating) - parseFloat(a.average_rating);
        case "reviews":
          return b.review_count - a.review_count;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [courses, searchQuery, selectedSemester, selectedYear, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-secondary">Loading courses...</p>
        </div>
      </div>
    );
  }

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
          options={["rating", "reviews", "name"]}
          selected={sortBy}
          onChange={setSortBy}
        />
        <ResultsCount count={filteredAndSortedCourses.length} singular="course" />
      </motion.div>

      {/* Courses Grid */}
      {filteredAndSortedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCourses.map((course, index) => (
            <motion.div
              key={course.id + searchQuery}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * Math.min(index, 10) }}
            >
              <CourseCard course={course} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="w-16 h-16" />}
          title="No courses found"
          description="Try adjusting your search criteria or filters"
        />
      )}
    </div>
  );
}
