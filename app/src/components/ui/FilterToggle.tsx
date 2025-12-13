"use client";

import { ReactNode } from "react";

interface FilterToggleProps {
  label: string;
  icon?: ReactNode;
  active: boolean;
  onClick: () => void;
  activeColor?: "red" | "blue" | "yellow" | "green" | "primary";
  className?: string;
}

const colorMap = {
  red: {
    active: "bg-red-500/20 border-red-500 text-red-300",
    inactive: "bg-background/50 border-border hover:border-red-500/50",
  },
  blue: {
    active: "bg-blue-500/20 border-blue-500 text-blue-300",
    inactive: "bg-background/50 border-border hover:border-blue-500/50",
  },
  yellow: {
    active: "bg-yellow-500/20 border-yellow-500 text-yellow-300",
    inactive: "bg-background/50 border-border hover:border-yellow-500/50",
  },
  green: {
    active: "bg-green-500/20 border-green-500 text-green-300",
    inactive: "bg-background/50 border-border hover:border-green-500/50",
  },
  primary: {
    active: "bg-primary/20 border-primary text-primary",
    inactive: "bg-background/50 border-border hover:border-primary/50",
  },
};

/**
 * Toggle button for filter options
 * Used for binary filter states like "Banned Only" or "Admins Only"
 */
export function FilterToggle({
  label,
  icon,
  active,
  onClick,
  activeColor = "primary",
  className = "",
}: FilterToggleProps) {
  const colors = colorMap[activeColor];

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
        active ? colors.active : colors.inactive
      } ${className}`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </button>
  );
}
