"use client";

import { ListPageWrapper } from "@/components/layout/ListPageWrapper";
import { PageHeader } from "@/components/ui";
import { CoursesList } from "@/components/courses";

/**
 * Courses listing page
 * Uses self-contained CoursesList component to prevent full page re-renders
 * when filtering or searching
 */
export default function CoursesPage() {
  return (
    <ListPageWrapper>
      <PageHeader
        title="Courses"
        description="Discover and review courses at IIITH"
      />
      <CoursesList />
    </ListPageWrapper>
  );
}
