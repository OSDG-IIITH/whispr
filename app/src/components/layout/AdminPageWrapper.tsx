"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { AccessDenied } from "@/components/ui";

interface AdminPageWrapperProps {
  children: ReactNode;
  title: string;
  description: string;
  maxWidth?: "6xl" | "7xl";
}

/**
 * Wrapper component for admin pages
 * Handles authentication check and provides consistent layout with back navigation
 */
export function AdminPageWrapper({
  children,
  title,
  description,
  maxWidth = "7xl",
}: AdminPageWrapperProps) {
  const { user } = useAuth();

  // Check admin permissions
  if (!user || !(user as { is_admin?: boolean }).is_admin) {
    return (
      <AccessDenied
        title="Access Denied"
        message="Admin privileges required to access this page."
      />
    );
  }

  const maxWidthClass = maxWidth === "7xl" ? "max-w-7xl" : "max-w-6xl";

  return (
    <div className="min-h-screen bg-black">
      <div className={`${maxWidthClass} mx-auto p-4 sm:p-6 lg:p-8`}>
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          {/* Back Link */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          <p className="text-secondary mt-1">{description}</p>
        </motion.div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
