import { ReactNode } from "react";

interface ListPageWrapperProps {
  children: ReactNode;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "6xl" | "7xl";
  className?: string;
}

const maxWidthMap = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

/**
 * Wrapper component for list-style pages
 * Provides consistent padding, max-width, and background
 */
export function ListPageWrapper({
  children,
  maxWidth = "6xl",
  className = "",
}: ListPageWrapperProps) {
  return (
    <div className={`min-h-screen bg-black pb-24 ${className}`}>
      <div className={`${maxWidthMap[maxWidth]} mx-auto px-2 sm:px-4 py-8`}>
        {children}
      </div>
    </div>
  );
}
