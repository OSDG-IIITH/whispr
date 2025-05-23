"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Star, Users, BookOpen } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string;
  averageRating: number;
  reviewCount: number;
  semester: string;
  year: number;
}

const mockCourses: Course[] = [
  {
    id: "1",
    code: "CS101",
    name: "Computer Networks",
    credits: 3,
    description: "Introduction to computer networks, protocols, and distributed systems",
    averageRating: 4.2,
    reviewCount: 45,
    semester: "MONSOON",
    year: 2024
  },
  {
    id: "2",
    code: "CS202",
    name: "Data Structures & Algorithms",
    credits: 4,
    description: "Fundamental data structures and algorithmic techniques",
    averageRating: 4.5,
    reviewCount: 67,
    semester: "SPRING",
    year: 2024
  },
  {
    id: "3", 
    code: "CS301",
    name: "Database Systems",
    credits: 3,
    description: "Design and implementation of database management systems",
    averageRating: 3.8,
    reviewCount: 32,
    semester: "MONSOON",
    year: 2024
  }
];

export default function CoursesPage() {
  const [courses, setCourses] = useState(mockCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [sortBy, setSortBy] = useState("rating");

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester = selectedSemester === "ALL" || course.semester === selectedSemester;
    const matchesYear = selectedYear === "ALL" || course.year.toString() === selectedYear;
    
    return matchesSearch && matchesSemester && matchesYear;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-secondary'
        }`}
      />
    ));
  };

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
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
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
            
            <div>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full py-3 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="ALL">All Semesters</option>
                <option value="SPRING">Spring</option>
                <option value="MONSOON">Monsoon</option>
              </select>
            </div>
            
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full py-3 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === option
                    ? 'bg-primary text-black'
                    : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="text-secondary">
            {filteredCourses.length} courses found
          </div>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link href={`/courses/${course.id}`}>
                <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-primary">{course.code}</h3>
                      <h4 className="font-semibold mb-2">{course.name}</h4>
                    </div>
                    <div className="text-sm text-secondary">
                      {course.credits} credits
                    </div>
                  </div>

                  <p className="text-secondary text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(course.averageRating)}
                      </div>
                      <span className="text-sm font-medium">
                        {course.averageRating.toFixed(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-secondary">
                      <Users className="w-4 h-4" />
                      <span>{course.reviewCount}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs text-secondary">
                      {course.semester} {course.year}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
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