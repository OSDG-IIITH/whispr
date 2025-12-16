"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Flag,
  Shield,
  Ban,
  AlertTriangle,
  UserCheck,
  GraduationCap,
  BookOpen,
  History,
  ArrowRight,
  Mail,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { adminAPI } from "@/lib/admin-api";
import { AdminStats } from "@/types/admin-models";
import Loader from "@/components/common/Loader";
import Link from "next/link";

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  badge?: number;
  badgeColor?: string;
}

function QuickAction({ href, icon, iconColor, title, description, badge, badgeColor = "bg-primary" }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 sm:p-5 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
            {badge !== undefined && badge > 0 && (
              <span className={`${badgeColor} text-black text-xs font-bold px-2 py-0.5 rounded-full`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-secondary mt-1 line-clamp-2">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-secondary group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-secondary">{label}</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-background/50">
          {icon}
        </div>
      </div>
    </div>
  );
}

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
    if (user && !(user as { is_admin?: boolean }).is_admin) {
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

  if (!user || !(user as { is_admin?: boolean }).is_admin) {
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
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-secondary mt-1">
            Manage users, content, and moderation
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <StatCard
            label="Total Users"
            value={stats?.total_users || 0}
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
          />
          <StatCard
            label="Banned Users"
            value={stats?.banned_users || 0}
            icon={<Ban className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />}
          />
          <StatCard
            label="Pending Reports"
            value={stats?.pending_reports || 0}
            icon={<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />}
          />
          <StatCard
            label="Under Review"
            value={stats?.under_review_reports || 0}
            icon={<Flag className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />}
          />
        </motion.div>

        {/* User Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <QuickAction
              href="/admin/users"
              icon={<UserCheck className="w-5 h-5 text-white" />}
              iconColor="from-blue-500 to-blue-600"
              title="Manage Users"
              description="View, ban, and manage user accounts"
            />
            <QuickAction
              href="/admin/reports"
              icon={<Flag className="w-5 h-5 text-white" />}
              iconColor="from-orange-500 to-red-500"
              title="Review Reports"
              description="Handle user reports and take actions"
              badge={stats?.pending_reports}
              badgeColor="bg-yellow-500"
            />
            <QuickAction
              href="/admin/admins"
              icon={<Shield className="w-5 h-5 text-white" />}
              iconColor="from-purple-500 to-purple-600"
              title="Manage Admins"
              description="Add or remove admin privileges"
            />
          </div>
        </motion.div>

        {/* Content Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <h2 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Content Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <QuickAction
              href="/admin/professors"
              icon={<GraduationCap className="w-5 h-5 text-white" />}
              iconColor="from-cyan-500 to-cyan-600"
              title="Manage Professors"
              description="Edit, merge, and delete professor records"
            />
            <QuickAction
              href="/admin/courses"
              icon={<BookOpen className="w-5 h-5 text-white" />}
              iconColor="from-emerald-500 to-emerald-600"
              title="Manage Courses"
              description="Edit and manage course records"
            />
            <QuickAction
              href="/admin/course-instructors"
              icon={<Users className="w-5 h-5 text-white" />}
              iconColor="from-teal-500 to-teal-600"
              title="Course Instructors"
              description="Link professors to courses with semester/year"
            />
          </div>
        </motion.div>

        {/* System Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            System
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <QuickAction
              href="/admin/audit-log"
              icon={<History className="w-5 h-5 text-white" />}
              iconColor="from-amber-500 to-amber-600"
              title="Audit Log"
              description="View all admin actions and changes"
            />
            <QuickAction
              href="/admin/emails"
              icon={<Mail className="w-5 h-5 text-white" />}
              iconColor="from-teal-500 to-teal-600"
              title="Email Management"
              description="View and manage registered IIITH emails"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
