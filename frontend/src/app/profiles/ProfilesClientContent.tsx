"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Crown,
  Trophy,
  Filter,
  SortDesc,
  SortAsc,
  UserCheck,
  UserX,
  Award,
  TrendingUp,
  Calendar,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { userAPI } from "@/lib/api";
import { convertUserToFrontendUser } from "@/types/frontend-models";
import { FrontendUser } from "@/types/frontend-models";
import Loader from "@/components/common/Loader";

interface UserStats {
  total_users: number;
  verified_users: number;
  total_echoes: number;
  average_echoes: number;
}

export function ProfilesClientContent() {
  const [users, setUsers] = useState<FrontendUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<FrontendUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("echoes");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minEchoes, setMinEchoes] = useState("");
  const [isVerified, setIsVerified] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params: {
        limit?: number;
        exclude_leaderboard?: boolean;
        leaderboard_limit?: number;
        search?: string;
        sort_by?: string;
        order?: string;
        min_echoes?: number;
        is_verified?: boolean;
      } = {
        limit: 100,
        exclude_leaderboard: false, // Show all users, including leaderboard
        leaderboard_limit: 10,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (sortBy) {
        params.sort_by = sortBy;
        params.order = sortOrder;
      }

      if (minEchoes) {
        const minEchoesNum = parseInt(minEchoes);
        if (!isNaN(minEchoesNum)) {
          params.min_echoes = minEchoesNum;
        }
      }

      if (isVerified !== "all") {
        params.is_verified = isVerified === "verified";
      }

      const usersData = await userAPI.browseUsers(params);
      setUsers(usersData.map((user) => convertUserToFrontendUser(user)));
    } catch (err) {
      console.error("Error fetching users:", err);
      // Don't set error for this since it's just filtering
    }
  }, [searchQuery, sortBy, sortOrder, minEchoes, isVerified]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [leaderboardData, usersData, statsData] = await Promise.all([
        userAPI.getLeaderboard(10),
        userAPI.browseUsers({
          limit: 100,
          exclude_leaderboard: false, // Show all users, including leaderboard
          leaderboard_limit: 10,
        }),
        userAPI.getUserStats(),
      ]);

      setLeaderboard(
        leaderboardData.map((user) => convertUserToFrontendUser(user))
      );
      setUsers(usersData.map((user) => convertUserToFrontendUser(user)));
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load profiles. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const renderEchoPoints = (echoes: number) => {
    return (
      <div className="flex items-center gap-1 text-primary">
        <Award className="w-4 h-4" />
        <span className="font-medium">{echoes}</span>
      </div>
    );
  };

  const renderVerificationStatus = (user: FrontendUser) => {
    if (user.isVerified) {
      return (
        <div className="flex items-center gap-1 text-green-500">
          <UserCheck className="w-4 h-4" />
          <span className="text-xs">Verified</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-yellow-500">
          <UserX className="w-4 h-4" />
          <span className="text-xs">Unverified</span>
        </div>
      );
    }
  };

  const getLeaderboardIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Trophy className="w-5 h-5 text-amber-600" />;
      default:
        return <Hash className="w-5 h-5 text-secondary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-secondary">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Profiles</h3>
          <p className="text-secondary mb-4">{error}</p>
          <button onClick={fetchData} className="btn btn-primary h-10 w-24">
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
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">
            Community Profiles
          </h1>
          <p className="text-secondary text-sm sm:text-base">
            Discover active members of the IIITH community
          </p>
        </motion.div>

        {/* Stats Section */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-card border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </div>

            <div className="bg-card border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Verified</span>
              </div>
              <div className="text-2xl font-bold">{stats.verified_users}</div>
            </div>

            <div className="bg-card border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Total Echoes</span>
              </div>
              <div className="text-2xl font-bold">{stats.total_echoes}</div>
            </div>

            <div className="bg-card border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Avg Echoes</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.average_echoes.toFixed(1)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold">Top Contributors</h2>
          </div>

          <div className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-secondary mx-auto mb-2" />
                <p className="text-secondary">No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link href={`/profile/${user.username}`}>
                      <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 w-8">
                          {getLeaderboardIcon(index + 1)}
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              @{user.username}
                            </h3>
                            {renderVerificationStatus(user)}
                          </div>
                          {user.bio && (
                            <p className="text-xs text-secondary line-clamp-1">
                              {user.bio}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {renderEchoPoints(user.echoes)}
                          {user.student_since_year && (
                            <div className="flex items-center gap-1 text-secondary">
                              <Calendar className="w-3 h-3" />
                              <span className="text-xs">
                                {user.student_since_year}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-primary/20 rounded-xl p-4 sm:p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Browse All Users</h2>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by username or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm sm:text-base"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showFilters
                    ? "bg-primary text-black"
                    : "bg-muted text-secondary hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
                className="flex items-center gap-2 px-3 py-2 bg-muted text-secondary hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
              >
                {sortOrder === "desc" ? (
                  <SortDesc className="w-4 h-4" />
                ) : (
                  <SortAsc className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {sortOrder === "desc" ? "Descending" : "Ascending"}
                </span>
              </button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full py-2 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                  >
                    <option value="echoes">Echo Points</option>
                    <option value="username">Username</option>
                    <option value="created_at">Join Date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Verification Status
                  </label>
                  <select
                    value={isVerified}
                    onChange={(e) => setIsVerified(e.target.value)}
                    className="w-full py-2 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Min Echo Points
                  </label>
                  <input
                    type="number"
                    placeholder="Enter minimum..."
                    value={minEchoes}
                    onChange={(e) => setMinEchoes(e.target.value)}
                    className="w-full py-2 px-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Users Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Users</h2>
            <div className="text-secondary text-sm">
              {users.length} users found
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index % 10) }}
              >
                <Link href={`/profile/${user.username}`}>
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          @{user.username}
                        </h3>
                        {user.student_since_year && (
                          <div className="flex items-center gap-1 text-secondary mt-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">
                              Student since {user.student_since_year}
                            </span>
                          </div>
                        )}
                      </div>
                      {renderVerificationStatus(user)}
                    </div>

                    {user.bio && (
                      <p className="text-secondary text-sm mb-3 line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {renderEchoPoints(user.echoes)}
                      <div className="text-xs text-secondary">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {users.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Users className="w-16 h-16 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No users found</h3>
              <p className="text-secondary">
                Try adjusting your search criteria or filters
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
