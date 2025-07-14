"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, Star, GraduationCap } from "lucide-react";
import Link from "next/link";
import { professorAPI, Professor } from "@/lib/api";
import Loader from "@/components/common/Loader";

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState("ALL");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    try {
      setLoading(true);
      setError(null);
      const professorsData = await professorAPI.getProfessors(0, 1000); // Get all professors
      setProfessors(professorsData);
    } catch (err) {
      console.error("Error fetching professors:", err);
      setError("Failed to load professors. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Get unique labs for filtering
  const labs = ["ALL", ...Array.from(new Set(professors.map(prof => prof.lab).filter(Boolean)))];

  const filteredProfessors = professors.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prof.lab && prof.lab.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLab = selectedLab === "ALL" || prof.lab === selectedLab;

    return matchesSearch && matchesLab;
  });

  const sortedProfessors = [...filteredProfessors].sort((a, b) => {
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

  // Get courses taught by professor from course instructors
  const getCourses = (professor: Professor) => {
    if (!professor.course_instructors || professor.course_instructors.length === 0) {
      return [];
    }

    // Get unique courses
    const courses = new Map<string, string>();
    professor.course_instructors.forEach((instructor) => {
      if (instructor.course) {
        courses.set(instructor.course.id, instructor.course.code);
      }
    });

    return Array.from(courses.values());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-secondary">Loading professors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Professors</h3>
          <p className="text-secondary mb-4">{error}</p>
          <button onClick={fetchProfessors} className="btn btn-primary h-10 w-24">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">Professors</h1>
          <p className="text-secondary text-sm sm:text-base">
            Find and review professors at IIITH
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search professors or labs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full py-3 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base"
              >
                {labs.map(lab => (
                  <option key={lab} value={lab}>
                    {lab === "ALL" ? "All Labs" : lab}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Sort Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-2 sm:gap-0"
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-secondary text-sm sm:text-base">Sort by:</span>
            {['rating', 'reviews', 'name'].map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors ${sortBy === option
                  ? 'bg-primary text-black'
                  : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                  }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          <div className="text-secondary text-xs sm:text-base">
            {sortedProfessors.length} professors found
          </div>
        </motion.div>

        {/* Professors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProfessors.map((professor, index) => {
            const courses = getCourses(professor);

            return (
              <motion.div
                key={professor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link href={`/professors/${professor.id}`}>
                  <div className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg mb-1">{professor.name}</h3>
                        {professor.lab && (
                          <p className="text-primary text-xs sm:text-sm">{professor.lab}</p>
                        )}
                      </div>
                      <GraduationCap className="w-6 h-6 text-secondary" />
                    </div>

                    {/* Review Summary */}
                    {professor.review_summary && (
                      <div className="mb-4">
                        <h4 className="text-xs sm:text-sm font-medium mb-2">Summary</h4>
                        <p className="text-secondary text-xs line-clamp-3">
                          {professor.review_summary}
                        </p>
                      </div>
                    )}

                    {/* Courses */}
                    {courses.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs sm:text-sm font-medium mb-2">Courses</h4>
                        <div className="flex flex-wrap gap-1">
                          {courses.slice(0, 3).map((course, i) => (
                            <span key={i} className="bg-muted text-secondary text-xs px-2 py-1 rounded">
                              {course}
                            </span>
                          ))}
                          {courses.length > 3 && (
                            <span className="text-xs text-secondary">
                              +{courses.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {renderStars(parseFloat(professor.average_rating) || 0)}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {(parseFloat(professor.average_rating) || 0).toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs sm:text-sm text-secondary">
                        <Users className="w-4 h-4" />
                        <span>{professor.review_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedProfessors.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <GraduationCap className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No professors found</h3>
            <p className="text-secondary">
              Try adjusting your search criteria or filters
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}