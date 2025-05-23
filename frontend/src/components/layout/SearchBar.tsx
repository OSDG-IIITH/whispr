"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, SortAsc, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  onClose: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
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
        filter,
        sort
      });
      router.push(`/search?${params.toString()}`);
      onClose();
    }
  };

  const quickFilters = [
    { id: "all", label: "All" },
    { id: "courses", label: "Courses" },
    { id: "professors", label: "Professors" },
    { id: "reviews", label: "Reviews" }
  ];

  const sortOptions = [
    { id: "relevance", label: "Relevance" },
    { id: "newest", label: "Newest" },
    { id: "oldest", label: "Oldest" },
    { id: "rating", label: "Rating" }
  ];

  return (
    <div className="bg-card/90 backdrop-blur-xl border border-primary/20 rounded-xl p-4 shadow-2xl">
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

      {/* Quick Filters */}
      <div className="flex gap-2 mb-4">
        {quickFilters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f.id
                ? 'bg-primary text-black'
                : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Advanced Options */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
        >
          <Filter className="w-4 h-4" />
          More Filters
        </button>

        <div className="flex items-center gap-2">
          <SortAsc className="w-4 h-4 text-secondary" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent text-sm text-secondary border-none focus:outline-none cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id} className="bg-card">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-border"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-secondary mb-1">Semester</label>
              <select className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm">
                <option>Any</option>
                <option>Spring</option>
                <option>Monsoon</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Year</label>
              <select className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm">
                <option>Any</option>
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}