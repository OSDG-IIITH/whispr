import { AdminPageWrapper } from "@/components/layout/AdminPageWrapper";
import { CourseInstructorsManagement } from "@/components/admin/CourseInstructorsManagement";

export const dynamic = 'force-dynamic';

export default function CourseInstructorsPage() {
  return (
    <AdminPageWrapper
      title="Course Instructors"
      description="Link professors to courses with semester and year"
    >
      <CourseInstructorsManagement />
    </AdminPageWrapper>
  );
}
