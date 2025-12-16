import { AdminPageWrapper } from "@/components/layout/AdminPageWrapper";
import { EmailsManagement } from "@/components/admin/EmailsManagement";

export default function AdminEmailsPage() {
  return (
    <AdminPageWrapper
      title="Email Management"
      description="View and manage registered IIITH email addresses"
    >
      <EmailsManagement />
    </AdminPageWrapper>
  );
}
