"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Star, Users, BookOpen, Loader2, GraduationCap, Calendar } from "lucide-react";
import Link from "next/link";
import { courseAPI, Course } from "@/lib/api";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesData = await courseAPI.getCourses(0, 1000); // Get all courses
      setCourses(coursesData);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    // Note: We don't have semester/year in the current course model, so we'll skip those filters for now
    return matchesSearch;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-secondary'
          }`}
      />
    ));
  };

  const formatTimeInfo = (course: Course) => {
    if (!course.course_instructors || course.course_instructors.length === 0) {
      return null;
    }

    // Get unique semester/year combinations
    const timeSlots = new Set<string>();
    course.course_instructors.forEach(instructor => {
      if (instructor.semester && instructor.year) {
        timeSlots.add(`${instructor.semester} ${instructor.year}`);
      }
    });

    return Array.from(timeSlots).join(", ");
  };

  const getProfessors = (course: Course) => {
    if (!course.course_instructors || course.course_instructors.length === 0) {
      return [];
    }

    // Get unique professors
    const professors = new Map<string, string>();
    course.course_instructors.forEach(instructor => {
      if (instructor.professor) {
        professors.set(instructor.professor.id, instructor.professor.name);
      }
    });

    return Array.from(professors.values());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-secondary">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Courses</h3>
          <p className="text-secondary mb-4">{error}</p>
          <button
            onClick={fetchCourses}
            className="btn btn-primary h-10 w-24"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Courses</h1>
          <p className="text-secondary">
            Discover and review courses at IIITH
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-primary/20 rounded-xl p-6 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="flex-1 py-3 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="ALL">All Semesters</option>
                <option value="SPRING">Spring</option>
                <option value="MONSOON">Monsoon</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="flex-1 py-3 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="ALL">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Sort Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <span className="text-secondary">Sort by:</span>
            {["rating", "reviews", "name"].map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${sortBy === option
                  ? 'bg-primary text-black'
                  : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                  }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          <div className="text-secondary">
            {sortedCourses.length} courses found
          </div>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((course, index) => {
            const timeInfo = formatTimeInfo(course);
            const professors = getProfessors(course);

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link href={`/courses/${course.code}`}>
                  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                    {/* Time Info - More Prominent */}
                    {timeInfo && (
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">{timeInfo}</span>
                      </div>
                    )}

                    {/* Course Code and Credits */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-primary">{course.code}</h3>
                      </div>
                      <div className="text-sm text-secondary">
                        {course.credits} credits
                      </div>
                    </div>

                    {/* Course Name */}
                    <h4 className="font-semibold mb-3 text-lg">{course.name}</h4>

                    {/* Professors */}
                    {professors.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="w-4 h-4 text-secondary" />
                          <span className="text-sm font-medium text-secondary">Professors</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {professors.slice(0, 3).map((professor, i) => (
                            <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                              {professor}
                            </span>
                          ))}
                          {professors.length > 3 && (
                            <span className="text-xs text-secondary">
                              +{professors.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-secondary text-sm mb-4 line-clamp-3">
                      {course.description || "No description available"}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {renderStars(parseFloat(course.average_rating) || 0)}
                        </div>
                        <span className="text-sm font-medium">
                          {(parseFloat(course.average_rating) || 0).toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-secondary">
                        <Users className="w-4 h-4" />
                        <span>{course.review_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedCourses.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-secondary">
              Try adjusting your search criteria or filters
            </p>
          </motion.div>
        )}

        {/* Floating Add Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-32 right-6 bg-primary text-black p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}