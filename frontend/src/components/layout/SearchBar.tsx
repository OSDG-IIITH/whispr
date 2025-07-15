"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  SortAsc,
  X,
  Calendar,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  onClose: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("relevance");
  const [semester, setSemester] = useState("any");
  const [year, setYear] = useState("any");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams({
        q: query.trim(),
        entity_types:
          filter === "all"
            ? ""
            : filter === "professors"
            ? "professor"
            : filter === "courses"
            ? "course"
            : filter === "users"
            ? "user"
            : filter,
        sort_by:
          sort === "newest"
            ? "created_at"
            : sort === "oldest"
            ? "created_at"
            : sort === "rating"
            ? "rating"
            : "relevance",
        sort_order: sort === "oldest" ? "asc" : "desc",
      });
      router.push(`/search?${params.toString()}`);
      onClose();
    }
  };

  const quickFilters = [
    { id: "all", label: "All" },
    { id: "courses", label: "Courses" },
    { id: "professors", label: "Professors" },
    { id: "reviews", label: "Reviews" },
    { id: "course_instructors", label: "Course Offerings" },
    { id: "users", label: "Users" },
  ];

  const sortOptions = [
    { id: "relevance", label: "Relevance" },
    { id: "newest", label: "Newest" },
    { id: "oldest", label: "Oldest" },
    { id: "rating", label: "Rating" },
  ];

  const semesterOptions = [
    { id: "any", label: "Any" },
    { id: "spring", label: "Spring" },
    { id: "monsoon", label: "Monsoon" },
  ];

  const yearOptions = [
    { id: "any", label: "Any" },
    { id: "2024", label: "2024" },
    { id: "2023", label: "2023" },
    { id: "2022", label: "2022" },
  ];

  // Use a portal for the dropdowns to avoid containment issues
  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = () => {
      if (showSemesterDropdown || showYearDropdown) {
        setShowSemesterDropdown(false);
        setShowYearDropdown(false);
      }
    };

    // Only add listener when dropdowns are open
    if (showSemesterDropdown || showYearDropdown) {
      document.addEventListener("click", handleClickOutside, { capture: true });
      return () => {
        document.removeEventListener("click", handleClickOutside, {
          capture: true,
        });
      };
    }
  }, [showSemesterDropdown, showYearDropdown]);

  return (
    <div className="relative z-[1] bg-card/90 backdrop-blur-xl border border-primary/20 rounded-xl p-4 shadow-2xl max-w-lg mx-auto">
      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{
            opacity: 1,
            height: "auto",
            y: 0,
            transition: {
              duration: 0.3,
              ease: "easeOut",
              height: { duration: 0.4 },
              opacity: { duration: 0.2, delay: 0.1 },
            },
          }}
          exit={{
            opacity: 0,
            height: 0,
            y: -10,
            transition: {
              duration: 0.25,
              ease: "easeIn",
              opacity: { duration: 0.15 },
              height: { duration: 0.2, delay: 0.05 },
            },
          }}
          className="mb-4 pb-4 border-b border-border"
        >
          {/* Quick Filters - Shown in dropdown on mobile */}
          <div className="md:hidden mb-4">
            <label className="block text-sm text-secondary mb-2">
              Filter by
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    filter === f.id
                      ? "bg-primary text-black"
                      : "bg-muted text-secondary hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">
                Semester
              </label>
              <div className="relative" style={{ zIndex: 100 }}>
                <motion.button
                  onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                  className="w-full text-left bg-input border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {
                      semesterOptions.find((option) => option.id === semester)
                        ?.label
                    }
                  </div>
                  <motion.div
                    animate={{ rotate: showSemesterDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>

                {showSemesterDropdown && (
                  <div
                    className="fixed inset-0 bg-transparent z-[90]"
                    onClick={() => setShowSemesterDropdown(false)}
                  ></div>
                )}

                {showSemesterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: {
                        duration: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                        scale: { duration: 0.15 },
                      },
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      y: -8,
                      transition: {
                        duration: 0.15,
                        ease: "easeIn",
                      },
                    }}
                    style={{ position: "absolute", zIndex: 100 }}
                    className="absolute left-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg w-full"
                  >
                    {semesterOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSemester(option.id);
                          setShowSemesterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          semester === option.id
                            ? "bg-primary/10 text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-2">Year</label>
              <div className="relative" style={{ zIndex: 99 }}>
                <motion.button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="w-full text-left bg-input border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {yearOptions.find((option) => option.id === year)?.label}
                  </div>
                  <motion.div
                    animate={{ rotate: showYearDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>

                {showYearDropdown && (
                  <div
                    className="fixed inset-0 bg-transparent z-[90]"
                    onClick={() => setShowYearDropdown(false)}
                  ></div>
                )}

                {showYearDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: {
                        duration: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                        scale: { duration: 0.15 },
                      },
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      y: -8,
                      transition: {
                        duration: 0.15,
                        ease: "easeIn",
                      },
                    }}
                    style={{ position: "absolute", zIndex: 99 }}
                    className="absolute left-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg w-full"
                  >
                    {yearOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setYear(option.id);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          year === option.id
                            ? "bg-primary/10 text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced Options */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          onClick={() => setShowFilters(!showFilters)}
          className="hidden items-center gap-2 text-sm text-secondary hover:text-primary transition-colors md:inline-flex"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: showFilters ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Filter className="w-4 h-4" />
          </motion.div>
          More Filters
        </motion.button>
        <motion.button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors md:hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: showFilters ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Filter className="w-4 h-4" />
          </motion.div>
          Filters
        </motion.button>

        <div className="relative">
          <motion.button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SortAsc className="w-4 h-4" />
            {sortOptions.find((option) => option.id === sort)?.label}
          </motion.button>

          {showSortDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                  scale: { duration: 0.15 },
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: -8,
                transition: {
                  duration: 0.15,
                  ease: "easeIn",
                },
              }}
              className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]"
            >
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSort(option.id);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    sort === option.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, professors, reviews..."
            className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Quick Filters - Hidden on mobile */}
      <motion.div
        className="hidden md:flex gap-2 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
            ease: "easeOut",
            delay: 0.1,
          },
        }}
      >
        {quickFilters.map((f, index) => (
          <motion.button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              filter === f.id
                ? "bg-primary text-black scale-105 shadow-md"
                : "bg-muted text-secondary hover:bg-primary/10 hover:text-primary hover:scale-102"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.2,
                ease: "easeOut",
                delay: index * 0.05,
              },
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {f.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Search Button */}
      <div className="mb-4">
        <motion.button
          onClick={handleSearch}
          className="w-full flex items-center justify-center gap-2 bg-primary text-black py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="w-5 h-5" />
          Search
        </motion.button>
      </div>
    </div>
  );
}
