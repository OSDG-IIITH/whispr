import { AdminPageWrapper } from "@/components/layout/AdminPageWrapper";
import { ProfessorsManagement } from "@/components/admin";

export default function AdminProfessorsPage() {
  return (
    <AdminPageWrapper
      title="Professor Management"
      description="Edit, merge, and manage professor records"
    >
      <ProfessorsManagement />
    </AdminPageWrapper>
  );
}
