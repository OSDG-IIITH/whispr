/*
 * This file contains interfaces that closely match the backend database models.
 * These interfaces represent the data as it exists in the database.
 */

export interface User {
  id: string;
  username: string;
  bio?: string;
  student_since_year?: number;
  is_muffled: boolean;
  is_admin: boolean;
  echoes: number;
  created_at: string;
  updated_at: string;
}

export interface Professor {
  id: string;
  name: string;
  lab?: string;
  review_summary?: string;
  review_count: number;
  average_rating: string; // Numeric(3, 2) in DB is represented as string
  created_at: string;
  updated_at: string;
  social_media?: ProfessorSocialMedia[];
  course_instructors?: CourseInstructor[];
}

export interface ProfessorSocialMedia {
  id: string;
  professor_id: string;
  platform: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits?: number;
  description?: string;
  official_document_url?: string;
  review_summary?: string;
  review_count: number;
  average_rating: string; // Numeric(3, 2) in DB is represented as string
  created_at: string;
  updated_at: string;
  course_instructors?: CourseInstructor[];
}

export interface CourseInstructor {
  id: string;
  professor_id: string;
  course_id: string;
  semester?: string;
  year?: number;
  summary?: string;
  review_count: number;
  average_rating: string; // Numeric(3, 2) in DB is represented as string
  created_at: string;
  updated_at: string;
  professor?: Professor;
  course?: Course;
}

export interface Review {
  id: string;
  user_id: string;
  course_id?: string;
  professor_id?: string;
  rating: number;
  content?: string;
  upvotes: number;
  downvotes: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  course?: {
    id: string;
    code: string;
    name: string;
  };
  professor?: {
    id: string;
    name: string;
  };
  course_instructors?: {
    id: string;
    course: {
      id: string;
      code: string;
      name: string;
    };
    professor: {
      id: string;
      name: string;
    };
  }[];
}

export interface Reply {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Vote {
  id: string;
  user_id: string;
  review_id?: string;
  reply_id?: string;
  vote_type: boolean; // TRUE for upvote, FALSE for downvote
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  username: string;
  type: "MENTION" | "VOTE" | "REPLY" | "RANK_CHANGE" | "SYSTEM" | "FOLLOW" | "FOLLOWER_REVIEW" | "FOLLOWER_REPLY";
  content: string;
  source_id?: string;
  source_type?: string;
  actor_username?: string;
  is_read: boolean;
  created_at: string;
}

export interface UsedEmail {
  id: string;
  email: string;
  verified_at?: string;
  created_at: string;
}

export interface VerifiedEmail {
  id: string;
  email: string;
  user_id?: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  review_id?: string;
  reply_id?: string;
  reported_user_id?: string;
  report_type:
    | "spam"
    | "harassment"
    | "inappropriate"
    | "misinformation"
    | "other";
  reason: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Auth and verification related interfaces
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface TokenPayload {
  sub?: string;
}

export interface VerificationStatus {
  is_muffled: boolean;
  username: string;
  echoes: number;
}

export interface VerificationResponse {
  cas_url: string;
  session_token: string;
  expires_in_minutes: number;
}
