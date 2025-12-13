"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useProfessors } from "@/hooks/useData";
import { ProfessorCard } from "./ProfessorCard";
import { SearchInput, SortSelector, EmptyState, ResultsCount, Select } from "@/components/ui";
import Loader from "@/components/common/Loader";

/**
 * Self-contained professors list component
 * All filter/search state lives here to prevent parent page re-renders
 */
export function ProfessorsList() {
  const { professors, isLoading, isError, mutate } = useProfessors(0, 1000);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState("ALL");
  const [sortBy, setSortBy] = useState("rating");

  // Get unique labs for filtering - memoized to avoid recalculation
  const labOptions = useMemo(() => {
    const labSet = new Set(professors.map((prof) => prof.lab).filter(Boolean));
    return [
      { value: "ALL", label: "All Labs" },
      ...Array.from(labSet).map((lab) => ({ value: lab as string, label: lab as string })),
    ];
  }, [professors]);

  // Filter and sort logic - memoized
  const filteredAndSortedProfessors = useMemo(() => {
    const filtered = professors.filter((prof) => {
      const matchesSearch =
        prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prof.lab && prof.lab.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLab = selectedLab === "ALL" || prof.lab === selectedLab;
      return matchesSearch && matchesLab;
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
  }, [professors, searchQuery, selectedLab, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-secondary">Loading professors...</p>
        </div>
      </div>
    );
  }

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
          options={["rating", "reviews", "name"]}
          selected={sortBy}
          onChange={setSortBy}
        />
        <ResultsCount
          count={filteredAndSortedProfessors.length}
          singular="professor"
        />
      </motion.div>

      {/* Professors Grid */}
      {filteredAndSortedProfessors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProfessors.map((professor, index) => (
            <motion.div
              key={professor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * Math.min(index, 10) }}
            >
              <ProfessorCard professor={professor} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<GraduationCap className="w-16 h-16" />}
          title="No professors found"
          description="Try adjusting your search criteria or filters"
        />
      )}
    </div>
  );
}
