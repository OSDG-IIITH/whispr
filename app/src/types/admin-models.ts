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
