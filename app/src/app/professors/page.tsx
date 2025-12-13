"use client";

import { ListPageWrapper } from "@/components/layout/ListPageWrapper";
import { PageHeader } from "@/components/ui";
import { ProfessorsList } from "@/components/professors";

/**
 * Professors listing page
 * Uses self-contained ProfessorsList component to prevent full page re-renders
 * when filtering or searching
 */
export default function ProfessorsPage() {
  return (
    <ListPageWrapper>
      <PageHeader
        title="Professors"
        description="Find and review professors at IIITH"
      />
      <ProfessorsList />
    </ListPageWrapper>
  );
}