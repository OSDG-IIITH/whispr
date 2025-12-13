"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import Loader from "@/components/common/Loader";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  rowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
}

/**
 * Generic data table component for admin pages
 * Provides consistent table styling and loading states
 */
export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found",
  emptyIcon,
  rowKey,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        {emptyIcon && (
          <div className="w-12 h-12 text-secondary mx-auto mb-4">
            {emptyIcon}
          </div>
        )}
        <p className="text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto"
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`text-left p-4 font-semibold ${column.className || ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={rowKey(item)}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-border/50 hover:bg-background/20 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((column) => (
                <td key={column.key} className={`p-4 ${column.className || ""}`}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
