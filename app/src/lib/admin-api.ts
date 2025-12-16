import {
  AdminUser,
  AdminStats,
  AdminReport,
  BanUserRequest,
  AdminActionRequest,
  AdminProfessor,
  ProfessorUpdateRequest,
  CreateProfessorRequest,
  ProfessorMergeRequest,
  ProfessorMergePreview,
  AdminCourse,
  CourseUpdateRequest,
  CreateCourseRequest,
  CourseMergeRequest,
  CourseMergePreview,
  AuditLogEntry,
  AuditLogFilters,
  AuditActionType,
  AuditEntityType,
  AdminEmail,
} from "@/types/admin-models";

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

export type {
  AdminUser,
  AdminStats,
  AdminReport,
  BanUserRequest,
  AdminActionRequest,
  AdminProfessor,
  ProfessorUpdateRequest,
  CreateProfessorRequest,
  ProfessorMergeRequest,
  ProfessorMergePreview,
  AdminCourse,
  CourseUpdateRequest,
  CreateCourseRequest,
  CourseMergeRequest,
  CourseMergePreview,
  AuditLogEntry,
  AuditLogFilters,
  AuditActionType,
  AuditEntityType,
  AdminEmail,
};

export const adminAPI = {
  // =============================================================================
  // Stats
  // =============================================================================
  getStats: async (): Promise<AdminStats> => {
    return apiCall<AdminStats>("/admin/stats");
  },

  // =============================================================================
  // User Management
  // =============================================================================
  getUsers: async (
    params: {
      skip?: number;
      limit?: number;
      search?: string;
      banned_only?: boolean;
      admin_only?: boolean;
    } = {}
  ): Promise<{ users: AdminUser[]; total: number }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<{ users: AdminUser[]; total: number }>(`/admin/users?${searchParams.toString()}`);
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

  resetUserPassword: async (userId: string): Promise<{ message: string; temporary_password: string }> => {
    return apiCall<{ message: string; temporary_password: string }>(`/admin/users/${userId}/reset-password`, {
      method: "POST",
    });
  },

  // =============================================================================
  // Report Management
  // =============================================================================
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

  // =============================================================================
  // Professor Management
  // =============================================================================
  getProfessors: async (
    params: {
      skip?: number;
      limit?: number;
      search?: string;
      lab?: string;
    } = {}
  ): Promise<{ professors: AdminProfessor[]; total: number; labs: string[] }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<{ professors: AdminProfessor[]; total: number; labs: string[] }>(
      `/admin/professors?${searchParams.toString()}`
    );
  },

  getProfessor: async (id: string): Promise<AdminProfessor & { courses: unknown[]; reviews_count: number }> => {
    return apiCall(`/admin/professors/${id}`);
  },

  createProfessor: async (
    data: CreateProfessorRequest
  ): Promise<AdminProfessor> => {
    return apiCall<AdminProfessor>(`/admin/professors`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProfessor: async (
    id: string,
    data: ProfessorUpdateRequest
  ): Promise<AdminProfessor> => {
    return apiCall<AdminProfessor>(`/admin/professors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteProfessor: async (id: string): Promise<void> => {
    return apiCall<void>(`/admin/professors/${id}`, {
      method: "DELETE",
    });
  },

  previewMerge: async (
    canonicalId: string,
    variantId: string
  ): Promise<ProfessorMergePreview> => {
    return apiCall<ProfessorMergePreview>(`/admin/professors/merge`, {
      method: "POST",
      body: JSON.stringify({
        canonical_id: canonicalId,
        variant_id: variantId,
        preview: true,
      }),
    });
  },

  mergeProfessors: async (
    request: ProfessorMergeRequest
  ): Promise<{ success: boolean; message: string; canonical_id: string }> => {
    return apiCall(`/admin/professors/merge`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // =============================================================================
  // Course Management
  // =============================================================================
  getCourses: async (
    params: {
      skip?: number;
      limit?: number;
      search?: string;
    } = {}
  ): Promise<{ courses: AdminCourse[]; total: number }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<{ courses: AdminCourse[]; total: number }>(
      `/admin/courses?${searchParams.toString()}`
    );
  },

  getCourse: async (id: string): Promise<AdminCourse & { instructors: unknown[]; reviews_count: number }> => {
    return apiCall(`/admin/courses/${id}`);
  },

  updateCourse: async (
    id: string,
    data: CourseUpdateRequest
  ): Promise<AdminCourse> => {
    return apiCall<AdminCourse>(`/admin/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteCourse: async (id: string): Promise<void> => {
    return apiCall<void>(`/admin/courses/${id}`, {
      method: "DELETE",
    });
  },

  createCourse: async (data: CreateCourseRequest): Promise<AdminCourse> => {
    return apiCall<AdminCourse>(`/admin/courses`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  mergeCourses: async (
    data: CourseMergeRequest
  ): Promise<{ success: boolean; message: string; canonical_id: string }> => {
    return apiCall<{ success: boolean; message: string; canonical_id: string }>(
      `/admin/courses/merge`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  previewCourseMerge: async (
    data: CourseMergeRequest
  ): Promise<CourseMergePreview> => {
    return apiCall<CourseMergePreview>(`/admin/courses/merge`, {
      method: "POST",
      body: JSON.stringify({ ...data, preview: true }),
    });
  },

  // =============================================================================
  // Audit Log
  // =============================================================================
  getAuditLogs: async (
    params: AuditLogFilters = {}
  ): Promise<{
    logs: AuditLogEntry[];
    total: number;
    admins: { id: string; name: string }[];
  }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall(`/admin/audit-log?${searchParams.toString()}`);
  },

  // =============================================================================
  // Email Management
  // =============================================================================
  getEmails: async (
    params: {
      skip?: number;
      limit?: number;
      search?: string;
    } = {}
  ): Promise<{ emails: AdminEmail[]; total: number }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<{ emails: AdminEmail[]; total: number }>(
      `/admin/emails?${searchParams.toString()}`
    );
  },

  addEmail: async (email: string): Promise<AdminEmail> => {
    return apiCall<AdminEmail>(`/admin/emails`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  deleteEmail: async (id: string): Promise<void> => {
    return apiCall<void>(`/admin/emails`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  },

  // =============================================================================
  // Course Instructors
  // =============================================================================

  getCourseInstructors: async (filters?: {
    course_id?: string;
    professor_id?: string;
  }): Promise<{
    course_instructors: CourseInstructorDetail[];
  }> => {
    const params = new URLSearchParams();
    if (filters?.course_id) params.append("course_id", filters.course_id);
    if (filters?.professor_id) params.append("professor_id", filters.professor_id);
    return apiCall<{ course_instructors: CourseInstructorDetail[] }>(
      `/admin/course-instructors?${params.toString()}`
    );
  },

  createCourseInstructor: async (data: {
    course_id: string;
    professor_id: string;
    semester?: string;
    year?: number;
  }): Promise<CourseInstructorDetail> => {
    return apiCall<CourseInstructorDetail>(`/admin/course-instructors`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteCourseInstructor: async (id: string): Promise<void> => {
    return apiCall<void>(`/admin/course-instructors?id=${id}`, {
      method: "DELETE",
    });
  },

  updateCourseInstructor: async (data: {
    id: string;
    semester?: string;
    year?: number;
  }): Promise<CourseInstructorDetail> => {
    return apiCall<CourseInstructorDetail>(`/admin/course-instructors`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// CourseInstructorDetail type for admin panel
export interface CourseInstructorDetail {
  id: string;
  course_id: string;
  professor_id: string;
  semester?: string;
  year?: number;
  course: {
    id: string;
    code: string;
    name: string;
  };
  professor: {
    id: string;
    name: string;
    lab?: string;
  };
  created_at: string;
}
