const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const token = localStorage.getItem("access_token");

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", {
        url: url,
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new Error(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Return null for 204 No Content responses
    if (response.status === 204) {
      return null as T;
    }

    // Otherwise parse the JSON response
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Failed to connect to server. Please check if the backend is running and accessible.`
      );
    }
    throw error;
  }
}

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

export interface AdminStats {
  total_users: number;
  banned_users: number;
  pending_reports: number;
  under_review_reports: number;
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
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_action?: string;
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

export const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    return apiCall<AdminStats>("/admin/stats");
  },

  getUsers: async (
    params: {
      skip?: number;
      limit?: number;
      search?: string;
      banned_only?: boolean;
      admin_only?: boolean;
    } = {}
  ): Promise<AdminUser[]> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<AdminUser[]>(`/admin/users?${searchParams.toString()}`);
  },

  banUser: async (
    userId: string,
    banRequest: BanUserRequest
  ): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/admin/users/${userId}/ban`, {
      method: "POST",
      body: JSON.stringify(banRequest),
    });
  },

  unbanUser: async (userId: string): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/admin/users/${userId}/ban`, {
      method: "DELETE",
    });
  },

  makeAdmin: async (userId: string): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/admin/users/${userId}/admin`, {
      method: "POST",
    });
  },

  removeAdmin: async (userId: string): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/admin/users/${userId}/admin`, {
      method: "DELETE",
    });
  },

  getReports: async (
    params: {
      skip?: number;
      limit?: number;
      status?: string;
      report_type?: string;
    } = {}
  ): Promise<AdminReport[]> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<AdminReport[]>(`/admin/reports?${searchParams.toString()}`);
  },

  takeActionOnReport: async (
    reportId: string,
    action: AdminActionRequest
  ): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/admin/reports/${reportId}/action`, {
      method: "PUT",
      body: JSON.stringify(action),
    });
  },
};
