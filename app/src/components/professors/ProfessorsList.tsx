"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useProfessors } from "@/hooks/useData";
import { ProfessorCard } from "./ProfessorCard";
import { SearchInput, SortSelector, EmptyState, ResultsCount, Select, Pagination } from "@/components/ui";
import Loader from "@/components/common/Loader";

const PAGE_SIZE = 21; // 7 rows of 3 cards

/**
 * Professors list with server-side filtering and numbered pagination
 */
export function ProfessorsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLab, setSelectedLab] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
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
  }, [selectedLab]);

  const { professors, total, labs, isLoading, isError, mutate } = useProfessors({
    skip: (currentPage - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    lab: selectedLab,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build lab options
  const labOptions = useMemo(() => [
    { value: "ALL", label: "All Labs" },
    ...labs.map((lab) => ({ value: lab, label: lab })),
  ], [labs]);

  // Sort client-side
  const sortedProfessors = useMemo(() => {
    if (!professors || professors.length === 0) return [];
    return [...professors].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return parseFloat(b.average_rating) - parseFloat(a.average_rating);
        case "reviews":
          return b.review_count - a.review_count;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [professors, sortBy]);

  if (isError) {
    return (
      <EmptyState
        icon={<GraduationCap className="w-16 h-16" />}
        title="Error Loading Professors"
        description="Failed to load professors. Please try again later."
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              onChange={setSearchQuery}
              placeholder="Search professors or labs..."
            />
          </div>

          <Select
            value={selectedLab}
            onChange={setSelectedLab}
            options={labOptions}
          />
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
          options={["name", "rating", "reviews"]}
          selected={sortBy}
          onChange={setSortBy}
        />
        <ResultsCount count={total} singular="professor" />
      </motion.div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="mx-auto mb-4" />
            <p className="text-secondary">Loading professors...</p>
          </div>
        </div>
      ) : sortedProfessors.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-16 h-16" />}
          title="No professors found"
          description="Try adjusting your search criteria or filters"
        />
      ) : (
        <>
          {/* Professors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProfessors.map((professor, index) => (
              <motion.div
                key={professor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * Math.min(index, 6) }}
              >
                <ProfessorCard professor={professor} />
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
