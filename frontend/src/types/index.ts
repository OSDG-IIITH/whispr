export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  student_since_year?: number;
  is_muffled: boolean;
  is_verified: boolean;
  is_admin: boolean;
  echoes: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface VerificationStatus {
  is_verified: boolean;
  is_muffled: boolean;
  username: string;
  echoes: number;
}

export interface VerificationResponse {
  cas_url: string;
  session_token: string;
  expires_in_minutes: number;
}

export interface Rank {
  name: string;
  min: number;
  max: number;
  color: string;
  gradient: string;
  icon: string;
}