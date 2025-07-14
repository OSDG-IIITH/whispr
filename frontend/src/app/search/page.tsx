"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Users, BookOpen, GraduationCap, MessageSquare, UserCheck, ChevronDown } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UserAvatar } from "@/components/user/UserAvatar";
import { RankBadge } from "@/components/user/RankBadge";
import { searchAPI } from "@/lib/api";

interface SearchResultData {
  id: string;
  type: "course" | "professor" | "review" | "reply" | "course_instructor";
  title: string;
  subtitle?: string;
  description: string;
  rating?: number;
  metadata?: any;
  relevanceScore: number;
  rawData: any;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<SearchResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [entityTypes, setEntityTypes] = useState<string[]>(
    searchParams.get("entity_types")?.split(",").filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "relevance");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sort_order") || "desc");
  const [deepSearch, setDeepSearch] = useState(searchParams.get("deep") === "true");
  const [minRating, setMinRating] = useState<number | undefined>(
    searchParams.get("min_rating") ? parseInt(searchParams.get("min_rating")!) : undefined
  );
  const [maxRating, setMaxRating] = useState<number | undefined>(
    searchParams.get("max_rating") ? parseInt(searchParams.get("max_rating")!) : undefined
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const RESULTS_PER_PAGE = 20;

  const performSearch = useCallback(async (page = 0, append = false) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params: any = {
        query: query.trim(),
        deep: deepSearch,
        sort_by: sortBy,
        sort_order: sortOrder,
        skip: page * RESULTS_PER_PAGE,
        limit: RESULTS_PER_PAGE,
      };

      if (entityTypes.length > 0) {
        params.entity_types = entityTypes;
      }

      if (minRating !== undefined) {
        params.min_rating = minRating;
      }

      if (maxRating !== undefined) {
        params.max_rating = maxRating;
      }

      const response = await searchAPI.search(params);

      // Transform API results to our format
      const transformedResults: SearchResultData[] = response.results.map((result: any) => {
        let transformedResult: SearchResultData;

        switch (result.entity_type) {
          case "course":
            transformedResult = {
              id: result.data.id,
              type: "course",
              title: `${result.data.code} - ${result.data.name}`,
              subtitle: `${result.data.credits} Credits`,
              description: result.data.description || "No description available",
              rating: result.data.average_rating ? Number(result.data.average_rating) : undefined,
              metadata: {
                reviewCount: result.data.review_count,
                code: result.data.code,
                credits: result.data.credits
              },
              relevanceScore: result.relevance_score,
              rawData: result.data
            };
            break;

          case "professor":
            transformedResult = {
              id: result.data.id,
              type: "professor",
              title: result.data.name,
              subtitle: result.data.lab || "Faculty",
              description: result.data.review_summary || "No summary available",
              rating: result.data.average_rating ? Number(result.data.average_rating) : undefined,
              metadata: {
                reviewCount: result.data.review_count,
                lab: result.data.lab
              },
              relevanceScore: result.relevance_score,
              rawData: result.data
            };
            break;

          case "course_instructor":
            transformedResult = {
              id: result.data.id,
              type: "course_instructor",
              title: `${result.data.course.code} - ${result.data.professor.name}`,
              subtitle: `${result.data.semester} ${result.data.year}`,
              description: result.data.summary || `${result.data.professor.name} teaching ${result.data.course.name}`,
              rating: result.data.average_rating ? Number(result.data.average_rating) : undefined,
              metadata: {
                reviewCount: result.data.review_count,
                semester: result.data.semester,
                year: result.data.year,
                courseCode: result.data.course.code,
                professorName: result.data.professor.name
              },
              relevanceScore: result.relevance_score,
              rawData: result.data
            };
            break;

          case "review":
            transformedResult = {
              id: result.data.id,
              type: "review",
              title: "Review",
              subtitle: `by ${result.data.user.username} • ${result.data.rating} stars`,
              description: result.data.content,
              metadata: {
                upvotes: result.data.upvotes,
                downvotes: result.data.downvotes,
                createdAt: new Date(result.data.created_at).toLocaleDateString(),
                username: result.data.user.username,
                rating: result.data.rating
              },
              relevanceScore: result.relevance_score,
              rawData: result.data
            };
            break;

          case "reply":
            transformedResult = {
              id: result.data.id,
              type: "reply",
              title: "Reply",
              subtitle: `by ${result.data.user.username}`,
              description: result.data.content,
              metadata: {
                upvotes: result.data.upvotes,
                downvotes: result.data.downvotes,
                createdAt: new Date(result.data.created_at).toLocaleDateString(),
                username: result.data.user.username
              },
              relevanceScore: result.relevance_score,
              rawData: result.data
            };
            break;

          default:
            transformedResult = {
              id: result.data.id || Math.random().toString(),
              type: result.entity_type,
              title: "Unknown",
              description: "Unknown result type",
              metadata: {},
              relevanceScore: result.relevance_score,
              rawData: result.data
            };
        }

        return transformedResult;
      });

      if (append) {
        setResults(prev => [...prev, ...transformedResults]);
      } else {
        setResults(transformedResults);
      }

      setTotalResults(response.total);
      setCurrentPage(page);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [query, entityTypes, sortBy, sortOrder, deepSearch, minRating, maxRating]);

  useEffect(() => {
    if (query) {
      performSearch(0, false);
    }
  }, [query, entityTypes, sortBy, sortOrder, deepSearch, minRating, maxRating, performSearch]);

  const handleLoadMore = () => {
    performSearch(currentPage + 1, true);
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (entityTypes.length > 0) params.set("entity_types", entityTypes.join(","));
    if (sortBy !== "relevance") params.set("sort_by", sortBy);
    if (sortOrder !== "desc") params.set("sort_order", sortOrder);
    if (deepSearch) params.set("deep", "true");
    if (minRating !== undefined) params.set("min_rating", minRating.toString());
    if (maxRating !== undefined) params.set("max_rating", maxRating.toString());

    router.replace(`/search?${params.toString()}`);
  };

  const handleEntityTypeToggle = (type: string) => {
    const newTypes = entityTypes.includes(type)
      ? entityTypes.filter(t => t !== type)
      : [...entityTypes, type];
    setEntityTypes(newTypes);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case "professor":
        return <GraduationCap className="w-5 h-5 text-purple-500" />;
      case "course_instructor":
        return <UserCheck className="w-5 h-5 text-orange-500" />;
      case "review":
        return <MessageSquare className="w-5 h-5 text-yellow-500" />;
      case "reply":
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      default:
        return <Search className="w-5 h-5 text-secondary" />;
    }
  };

  const getResultLink = (result: SearchResultData) => {
    switch (result.type) {
      case "course":
        return `/courses/${result.metadata?.code}`;
      case "professor":
        return `/professors/${result.id}`;
      case "course_instructor":
        return `/courses/${result.metadata?.courseCode}?professor=${result.rawData?.professor?.id}`;
      case "review":
        // Find course code from the review data
        const reviewCourseCode = result.rawData?.course?.code ||
          result.rawData?.course_instructor?.course?.code;
        if (reviewCourseCode) {
          return `/courses/${reviewCourseCode}?reviewId=${result.id}`;
        }
        // Fallback to dashboard if no course code found
        return `/dashboard`;
      case "reply":
        // Find course code from the reply's review data
        const replyCourseCode = result.rawData?.review?.course?.code ||
          result.rawData?.review?.course_instructor?.course?.code;
        if (replyCourseCode) {
          return `/courses/${replyCourseCode}?reviewId=${result.rawData?.review_id}&replyId=${result.id}`;
        }
        // Fallback to dashboard if no course code found
        return `/dashboard`;
      default:
        return "#";
    }
  };

  const renderStars = (rating: number | string) => {
    const numRating = Number(rating);
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < Math.floor(numRating) ? 'text-yellow-500' : 'text-secondary'}`}
      >
        ★
      </span>
    ));
  };

  const entityTypeLabels: { [key: string]: string } = {
    course: "Courses",
    professor: "Professors",
    course_instructor: "Course Offerings",
    review: "Reviews",
    reply: "Replies"
  };

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "name", label: "Name" },
    { value: "rating", label: "Rating" },
    { value: "created_at", label: "Date" },
    { value: "code", label: "Course Code" }
  ];

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
              onBlur={updateURL}
              placeholder="Search courses, professors, reviews..."
              className="w-full pl-10 pr-4 py-4 bg-card border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-lg"
            />
          </div>

          {query && (
            <p className="text-secondary">
              {loading ? "Searching..." : `${totalResults} results for "${query}"`}
            </p>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Entity Type Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter className="w-4 h-4 text-secondary" />
            {Object.entries(entityTypeLabels).map(([type, label]) => (
              <button
                key={type}
                onClick={() => handleEntityTypeToggle(type)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${entityTypes.length === 0 || entityTypes.includes(type)
                  ? 'bg-primary text-black'
                  : 'bg-muted text-secondary hover:bg-primary/10 hover:text-primary'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort and Advanced Filters */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={deepSearch}
                    onChange={(e) => setDeepSearch(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 transition-colors ${deepSearch
                    ? 'bg-primary border-primary'
                    : 'border-border hover:border-primary/50'
                    }`}>
                    {deepSearch && (
                      <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-secondary hover:text-primary transition-colors">Deep Search</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-secondary text-sm">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-muted text-sm px-3 py-1.5 rounded-lg border-none focus:outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-muted text-sm px-2 py-1.5 rounded-lg border-none focus:outline-none"
                >
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-1">Min Rating</label>
                  <select
                    value={minRating || ""}
                    onChange={(e) => setMinRating(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-1">Max Rating</label>
                  <select
                    value={maxRating || ""}
                    onChange={(e) => setMaxRating(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results */}
        <div className="space-y-4">
          {loading && results.length === 0 ? (
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
                Try different keywords, enable deep search, or adjust your filters
              </p>
            </motion.div>
          ) : (
            results.map((result, index) => (
              <motion.div
                key={`${result.type}-${result.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Link href={getResultLink(result)}>
                  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                        {getResultIcon(result.type)}
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

                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-secondary bg-muted px-2 py-1 rounded">
                              {(result.relevanceScore * 100).toFixed(0)}% match
                            </span>
                          </div>
                        </div>

                        <p className="text-secondary mb-3 line-clamp-2">
                          {result.description}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-secondary justify-end">
                          {result.metadata?.reviewCount !== undefined && (
                            <span className="flex items-center gap-2">
                              {result.metadata.reviewCount} {result.metadata.reviewCount === 1 ? "review" : "reviews"}
                              {result.rating !== undefined && (
                                <span className="flex items-center gap-1 ml-2">
                                  {renderStars(result.rating)}
                                  <span className="text-sm text-secondary">{result.rating.toFixed(1)}</span>
                                </span>
                              )}
                            </span>
                          )}
                          {result.metadata?.upvotes !== undefined && (
                            <span>{result.metadata.upvotes} upvotes</span>
                          )}
                          {result.metadata?.createdAt && (
                            <span>{result.metadata.createdAt}</span>
                          )}
                          {result.metadata?.semester && result.metadata?.year && (
                            <span>{result.metadata.semester} {result.metadata.year}</span>
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
        {results.length > 0 && !loading && results.length < totalResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-8"
          >
            <button
              onClick={handleLoadMore}
              className="btn btn-secondary px-6 py-3"
            >
              Load More Results ({results.length} of {totalResults})
            </button>
          </motion.div>
        )}

        {loading && results.length > 0 && (
          <div className="text-center mt-4">
            <div className="text-secondary">Loading more results...</div>
          </div>
        )}
      </div>
    </div>
  );
}