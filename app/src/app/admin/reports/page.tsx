"use client";

import { AdminPageWrapper } from "@/components/layout/AdminPageWrapper";
import { ReportsManagement } from "@/components/admin";

/**
 * Admin reports management page
 * Uses self-contained ReportsManagement component to prevent full page re-renders
 */
export default function AdminReportsPage() {
  return (
    <AdminPageWrapper
      title="Report Management"
      description="Review and take action on user reports"
    >
      <ReportsManagement />
    </AdminPageWrapper>
  );
}
