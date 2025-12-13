import { AdminPageWrapper } from "@/components/layout/AdminPageWrapper";
import { CoursesManagement } from "@/components/admin";

export default function AdminCoursesPage() {
  return (
    <AdminPageWrapper
      title="Course Management"
      description="Edit and manage course records"
    >
      <CoursesManagement />
    </AdminPageWrapper>
  );
}
