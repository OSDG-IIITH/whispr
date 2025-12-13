"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state display for when no data is available
 * Used across list pages when search/filter returns no results
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 text-secondary mx-auto mb-4 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-secondary mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary px-6 py-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
