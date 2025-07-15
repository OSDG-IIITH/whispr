"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, SortAsc, X, Calendar, Clock, ChevronDown } from "lucide-react";
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
        entity_types: filter === 'all' ? '' : filter === 'professors' ? 'professor' : filter === 'courses' ? 'course' : filter,
        sort_by: sort === 'newest' ? 'created_at' : sort === 'oldest' ? 'created_at' : sort === 'rating' ? 'rating' : 'relevance',
        sort_order: sort === 'oldest' ? 'asc' : 'desc'
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
    { id: "course_instructors", label: "Course Offerings" }
  ];

  const sortOptions = [
    { id: "relevance", label: "Relevance" },
    { id: "newest", label: "Newest" },
    { id: "oldest", label: "Oldest" },
    { id: "rating", label: "Rating" }
  ];

  const semesterOptions = [
    { id: "any", label: "Any" },
    { id: "spring", label: "Spring" },
    { id: "monsoon", label: "Monsoon" }
  ];

  const yearOptions = [
    { id: "any", label: "Any" },
    { id: "2024", label: "2024" },
    { id: "2023", label: "2023" },
    { id: "2022", label: "2022" }
  ];

  return (
    <div className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-xl p-4 shadow-2xl max-w-lg mx-auto">
      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 pb-4 border-b border-border"
        >
          {/* Quick Filters - Shown in dropdown on mobile */}
          <div className="md:hidden mb-4">
            <label className="block text-sm text-secondary mb-2">Filter by</label>
            <div className="grid grid-cols-2 gap-2">
              {quickFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${filter === f.id
                    ? 'bg-primary text-black'
                    : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-2">Semester</label>
              <div className="relative">
                <button
                  onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                  className="w-full text-left bg-input border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {semesterOptions.find(option => option.id === semester)?.label}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showSemesterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10 w-full"
                  >
                    {semesterOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSemester(option.id);
                          setShowSemesterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${semester === option.id ? 'bg-primary/10 text-primary' : 'text-foreground'
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
              <div className="relative">
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="w-full text-left bg-input border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {yearOptions.find(option => option.id === year)?.label}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showYearDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10 w-full"
                  >
                    {yearOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setYear(option.id);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${year === option.id ? 'bg-primary/10 text-primary' : 'text-foreground'
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
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
        >
          <Filter className="w-4 h-4" />
          More Filters
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            <SortAsc className="w-4 h-4" />
            {sortOptions.find(option => option.id === sort)?.label}
          </button>

          {showSortDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]"
            >
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSort(option.id);
                    setShowSortDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${sort === option.id ? 'bg-primary/10 text-primary' : 'text-foreground'
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

      {/* Quick Filters - Hidden on mobile, Search button shown on mobile */}
      <div className="hidden md:flex gap-2 mb-4">
        {quickFilters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === f.id
              ? 'bg-primary text-black'
              : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Button - Shown on mobile only */}
      <div className="md:hidden mb-4">
        <button
          onClick={handleSearch}
          className="w-full flex items-center justify-center gap-2 bg-primary text-black py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Search className="w-5 h-5" />
          Search
        </button>
      </div>
    </div>
  );
}