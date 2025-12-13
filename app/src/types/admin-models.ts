export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  echoes: number;
  is_admin: boolean;
  is_muffled: boolean;
  is_banned: boolean;
  ban_reason?: string;
  banned_until?: string;
  banned_by?: string;
  banned_at?: string;
  created_at: string;
}

export interface AdminReport {
  id: string;
  reporter: {
    id: string;
    username: string;
  };
  reported_user?: {
    id: string;
    username: string;
  };
  review_id?: string;
  reply_id?: string;
  report_type: string;
  reason: string;
  status: string;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_action?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  banned_users: number;
  pending_reports: number;
  under_review_reports: number;
}

export interface BanUserRequest {
  reason: string;
  duration_days?: number;
}

export interface AdminActionRequest {
  status: string;
  action: string;
  notes?: string;
  ban_duration_days?: number;
}

// =============================================================================
// Professor Management Types
// =============================================================================

export interface AdminProfessor {
  id: string;
  name: string;
  lab?: string;
  review_summary?: string;
  review_count: number;
  average_rating: string;
  courses_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProfessorUpdateRequest {
  name?: string;
  lab?: string;
}

export interface ProfessorMergeRequest {
  canonical_id: string;
  variant_id: string;
}

export interface ProfessorMergePreview {
  canonical: AdminProfessor;
  variant: AdminProfessor;
  courses_to_transfer: number;
  reviews_to_transfer: number;
}

// =============================================================================
// Course Management Types
// =============================================================================

export interface AdminCourse {
  id: string;
  code: string;
  name: string;
  credits?: number;
  description?: string;
  official_document_url?: string;
  review_summary?: string;
  review_count: number;
  average_rating: string;
  instructors_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CourseUpdateRequest {
  code?: string;
  name?: string;
  credits?: number;
  description?: string;
  official_document_url?: string;
}

export interface CourseInstructorInfo {
  id: string;
  professor_id: string;
  professor_name: string;
  semester?: string;
  year?: number;
  review_count: number;
  average_rating: string;
}

// =============================================================================
// Audit Log Types
// =============================================================================

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "MERGE"
  | "BAN"
  | "UNBAN"
  | "MAKE_ADMIN"
  | "REMOVE_ADMIN"
  | "REPORT_DISMISS"
  | "REPORT_RESOLVE";

export type AuditEntityType =
  | "PROFESSOR"
  | "COURSE"
  | "USER"
  | "REPORT"
  | "COURSE_INSTRUCTOR";

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id?: string;
  entity_name?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogFilters {
  admin_id?: string;
  action_type?: AuditActionType;
  entity_type?: AuditEntityType;
  from_date?: string;
  to_date?: string;
  skip?: number;
  limit?: number;
}

// =============================================================================
// Enhanced Admin Stats
// =============================================================================

export interface EnhancedAdminStats extends AdminStats {
  total_professors: number;
  total_courses: number;
  total_reviews: number;
}
