"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Users, BookOpen, GraduationCap, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserAvatar } from "@/components/user/UserAvatar";
import { RankBadge } from "@/components/user/RankBadge";

interface SearchResult {
  id: string;
  type: "course" | "professor" | "user" | "review";
  title: string;
  subtitle?: string;
  description: string;
  rating?: number;
  metadata?: any;
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    type: "course",
    title: "CS101 - Computer Networks",
    subtitle: "3 Credits | MONSOON 2024",
    description: "Introduction to computer networks covering fundamental concepts of networking protocols...",
    rating: 4.2,
    metadata: { reviewCount: 45, code: "CS101" }
  },
  {
    id: "2",
    type: "professor",
    title: "Dr. Network Expert",
    subtitle: "Networking Lab",
    description: "Leading researcher in computer networks and distributed systems with 10+ years experience...",
    rating: 4.5,
    metadata: { reviewCount: 34, courses: ["CS101", "CS301"] }
  },
  {
    id: "3",
    type: "user",
    title: "network_ninja",
    subtitle: "Trusted Whisperer",
    description: "Active reviewer with expertise in systems and networking courses",
    metadata: { echoes: 234, reviewCount: 12, isVerified: true }
  },
  {
    id: "4",
    type: "review",
    title: "Review of Computer Networks",
    subtitle: "by silent_student • 5 stars",
    description: "Honestly one of the best courses I've taken at IIITH. Prof explains concepts really well...",
    metadata: { upvotes: 24, replyCount: 5, createdAt: "2024-01-20" }
  }
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState(mockResults);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Implement actual search API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Filter results based on type
      const filteredResults = filter === "all"
        ? mockResults
        : mockResults.filter(result => result.type === filter);
      setResults(filteredResults);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, filter, sort, performSearch]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case "professor":
        return <GraduationCap className="w-5 h-5 text-purple-500" />;
      case "user":
        return <Users className="w-5 h-5 text-green-500" />;
      case "review":
        return <MessageSquare className="w-5 h-5 text-yellow-500" />;
      default:
        return <Search className="w-5 h-5 text-secondary" />;
    }
  };

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case "course":
        return `/courses/${result.id}`;
      case "professor":
        return `/professors/${result.id}`;
      case "user":
        return `/profile/${result.title}`;
      case "review":
        return `/courses/${result.id}#review-${result.id}`;
      default:
        return "#";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-500' : 'text-secondary'
          }`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, professors, users, reviews..."
              className="w-full pl-10 pr-4 py-4 bg-card border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-lg"
            />
          </div>

          {query && (
            <p className="text-secondary">
              {loading ? "Searching..." : `${results.length} results for "${query}"`}
            </p>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary" />
            {["all", "courses", "professors", "users", "reviews"].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${filter === filterOption
                    ? 'bg-primary text-black'
                    : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                  }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-secondary text-sm">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-muted text-sm px-3 py-1.5 rounded-lg border-none focus:outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="rating">Rating</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </motion.div>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="w-3/4 h-6 bg-muted rounded animate-pulse" />
                    <div className="w-1/2 h-4 bg-muted rounded animate-pulse" />
                    <div className="w-full h-4 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : results.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Search className="w-16 h-16 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-secondary">
                Try different keywords or adjust your filters
              </p>
            </motion.div>
          ) : (
            results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link href={getResultLink(result)}>
                  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                        {result.type === "user" ? (
                          <UserAvatar
                            username={result.title}
                            echoes={result.metadata?.echoes || 0}
                            size="sm"
                            avatarUrl={result.metadata?.avatarUrl}
                          />
                        ) : (
                          getResultIcon(result.type)
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
                              {result.title}
                            </h3>
                            {result.subtitle && (
                              <p className="text-secondary text-sm mb-2">
                                {result.subtitle}
                              </p>
                            )}
                          </div>

                          {result.rating && (
                            <div className="flex items-center gap-1 ml-4">
                              {renderStars(result.rating)}
                              <span className="text-sm font-medium ml-1">
                                {result.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-secondary mb-3 line-clamp-2">
                          {result.description}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-secondary">
                          {result.type === "user" && result.metadata && (
                            <>
                              <RankBadge echoes={result.metadata.echoes} size="sm" showIcon={false} />
                              <span>{result.metadata.reviewCount} reviews</span>
                              {result.metadata.isVerified && (
                                <span className="text-primary">✓ Verified</span>
                              )}
                            </>
                          )}

                          {(result.type === "course" || result.type === "professor") && result.metadata && (
                            <span>{result.metadata.reviewCount} reviews</span>
                          )}

                          {result.type === "review" && result.metadata && (
                            <>
                              <span>{result.metadata.upvotes} upvotes</span>
                              <span>{result.metadata.replyCount} replies</span>
                              <span>{result.metadata.createdAt}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Load More */}
        {results.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8"
          >
            <button className="btn btn-secondary px-6 py-3">
              Load More Results
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}