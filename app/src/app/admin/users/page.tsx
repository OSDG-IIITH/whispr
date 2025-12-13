"use client";

import { AdminPageWrapper } from "@/components/layout/AdminPageWrapper";
import { UsersManagement } from "@/components/admin";

/**
 * Admin users management page
 * Uses self-contained UsersManagement component to prevent full page re-renders
 */
export default function AdminUsersPage() {
  return (
    <AdminPageWrapper
      title="User Management"
      description="Manage user accounts, bans, and permissions"
    >
      <UsersManagement />
    </AdminPageWrapper>
  );
}
