import { AdminPageWrapper } from "@/components/layout/AdminPageWrapper";
import { AdminsManagement } from "@/components/admin";

export default function AdminsPage() {
  return (
    <AdminPageWrapper
      title="Manage Admins"
      description="Add or remove admin privileges"
    >
      <AdminsManagement />
    </AdminPageWrapper>
  );
}
