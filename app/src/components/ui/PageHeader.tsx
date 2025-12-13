"use client";

import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

/**
 * Animated page header with title and description
 * Provides consistent header styling across pages
 */
export function PageHeader({
  title,
  description,
  className = "",
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 ${className}`}
    >
      <h1 className="text-2xl sm:text-4xl font-bold mb-2">{title}</h1>
      {description && (
        <p className="text-secondary text-sm sm:text-base">{description}</p>
      )}
    </motion.div>
  );
}
