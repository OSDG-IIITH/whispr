"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Flag,
  Shield,
  Ban,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { adminAPI } from "@/lib/admin-api";
import { AdminStats } from "@/types/admin-models";
import Loader from "@/components/common/Loader";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await adminAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      showError("Failed to load admin statistics.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (user && !user.is_admin) {
      showError("Access denied. Admin privileges required.");
      return;
    }

    fetchStats();
  }, [user, fetchStats, showError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-secondary">
            Admin privileges required to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-secondary">
            Manage users, reports, and moderation
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">
                  Total Users
                </p>
                <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">
                  Banned Users
                </p>
                <p className="text-2xl font-bold">{stats?.banned_users || 0}</p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">
                  Pending Reports
                </p>
                <p className="text-2xl font-bold">
                  {stats?.pending_reports || 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary">
                  Under Review
                </p>
                <p className="text-2xl font-bold">
                  {stats?.under_review_reports || 0}
                </p>
              </div>
              <Flag className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <a
            href="/admin/users"
            className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  Manage Users
                </h3>
                <p className="text-sm text-secondary">
                  View, ban, and manage user accounts
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-primary" />
            </div>
          </a>

          <a
            href="/admin/reports"
            className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  Review Reports
                </h3>
                <p className="text-sm text-secondary">
                  Handle user reports and take actions
                </p>
              </div>
              <Flag className="w-8 h-8 text-primary" />
            </div>
          </a>

          <a
            href="/admin/admins"
            className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  Manage Admins
                </h3>
                <p className="text-sm text-secondary">
                  Add or remove admin privileges
                </p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </a>
        </motion.div>
      </div>
    </div>
  );
}
