import { AdminPageWrapper } from "@/components/layout/AdminPageWrapper";
import { AuditLogViewer } from "@/components/admin";

export default function AdminAuditLogPage() {
  return (
    <AdminPageWrapper
      title="Audit Log"
      description="View all admin actions and changes"
    >
      <AuditLogViewer />
    </AdminPageWrapper>
  );
}
