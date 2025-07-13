// API service for backend integration
import {
  User,
  Review,
  Vote,
  Reply,
  Report,
  Notification,
  Professor,
  CourseInstructor,
  Course,
} from "@/types/backend-models";

import {
  FrontendUser,
  FrontendReview,
  FrontendReply,
  FrontendNotification,
  FrontendCourse,
  FrontendProfessor,
  FrontendCourseInstructor,
  convertUserToFrontendUser,
  convertNotificationToFrontendNotification,
  convertReviewToFrontendReview,
  convertReplyToFrontendReply,
} from "@/types/frontend-models";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface UserUpdate {
  username?: string;
  avatar_url?: string;
  bio?: string;
  student_since_year?: number;
  password?: string;
}

// Re-export types for convenience
export type {
  User,
  Review,
  Vote,
  Reply,
  Report,
  Notification,
  Professor,
  CourseInstructor,
  Course,
};
export type {
  FrontendUser,
  FrontendReview,
  FrontendReply,
  FrontendNotification,
  FrontendCourse,
  FrontendProfessor,
  FrontendCourseInstructor,
};

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

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

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    return apiCall<{ access_token: string; token_type: string }>(
      "/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );
  },

  register: async (username: string, password: string) => {
    return apiCall<{ access_token: string; token_type: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }
    );
  },

  logout: async () => {
    return apiCall<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },

  getCurrentUser: async () => {
    return apiCall<User>("/auth/me");
  },
};

// User API
export const userAPI = {
  getUsers: async (skip = 0, limit = 100) => {
    return apiCall<User[]>(`/users?skip=${skip}&limit=${limit}`);
  },

  getUser: async (userId: string) => {
    return apiCall<User>(`/users/${userId}`);
  },

  getUserByUsername: async (username: string) => {
    return apiCall<User>(`/users/by-username/${username}`);
  },

  updateUser: async (userData: UserUpdate) => {
    return apiCall<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  followUser: async (userId: string) => {
    return apiCall<User>(`/users/${userId}/follow`, {
      method: "POST",
    });
  },

  unfollowUser: async (userId: string) => {
    return apiCall<User>(`/users/${userId}/unfollow`, {
      method: "POST",
    });
  },
};

// Review API
export const reviewAPI = {
  getReviews: async (
    params: {
      skip?: number;
      limit?: number;
      course_id?: string;
      professor_id?: string;
      course_instructor_id?: string;
      user_id?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Review[]>(`/reviews?${searchParams.toString()}`);
  },

  getReview: async (reviewId: string) => {
    return apiCall<Review>(`/reviews/${reviewId}`);
  },

  createReview: async (reviewData: {
    course_id?: string;
    professor_id?: string;
    course_instructor_id?: string;
    rating: number;
    content?: string;
  }) => {
    return apiCall<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  },

  updateReview: async (
    reviewId: string,
    reviewData: {
      rating?: number;
      content?: string;
    }
  ) => {
    return apiCall<Review>(`/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(reviewData),
    });
  },

  deleteReview: async (reviewId: string) => {
    return apiCall<void>(`/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },
};

// Vote API
export const voteAPI = {
  getVotes: async (
    params: {
      skip?: number;
      limit?: number;
      user_id?: string;
      review_id?: string;
      reply_id?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Vote[]>(`/votes?${searchParams.toString()}`);
  },

  getMyVotes: async (
    params: {
      skip?: number;
      limit?: number;
      review_id?: string;
      reply_id?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Vote[]>(`/votes/me?${searchParams.toString()}`);
  },

  createVote: async (voteData: {
    review_id?: string;
    reply_id?: string;
    vote_type: boolean;
  }) => {
    return apiCall<Vote>("/votes", {
      method: "POST",
      body: JSON.stringify(voteData),
    });
  },

  deleteVote: async (voteId: string) => {
    return apiCall<void>(`/votes/${voteId}`, {
      method: "DELETE",
    });
  },
};

// Reply API
export const replyAPI = {
  getReplies: async (
    params: {
      skip?: number;
      limit?: number;
      review_id?: string;
      user_id?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Reply[]>(`/replies?${searchParams.toString()}`);
  },

  getReply: async (replyId: string) => {
    return apiCall<Reply>(`/replies/${replyId}`);
  },

  createReply: async (replyData: { review_id: string; content: string }) => {
    return apiCall<Reply>("/replies", {
      method: "POST",
      body: JSON.stringify(replyData),
    });
  },

  updateReply: async (
    replyId: string,
    replyData: {
      content?: string;
    }
  ) => {
    return apiCall<Reply>(`/replies/${replyId}`, {
      method: "PUT",
      body: JSON.stringify(replyData),
    });
  },

  deleteReply: async (replyId: string) => {
    return apiCall<void>(`/replies/${replyId}`, {
      method: "DELETE",
    });
  },
};

// Report API
export const reportAPI = {
  getReports: async (
    params: {
      skip?: number;
      limit?: number;
      status?: string;
      report_type?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Report[]>(`/reports?${searchParams.toString()}`);
  },

  getReport: async (reportId: string) => {
    return apiCall<Report>(`/reports/${reportId}`);
  },

  createReport: async (reportData: {
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
  }) => {
    return apiCall<Report>("/reports", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  },

  updateReport: async (
    reportId: string,
    reportData: {
      status?: "pending" | "reviewed" | "resolved" | "dismissed";
      admin_notes?: string;
    }
  ) => {
    return apiCall<Report>(`/reports/${reportId}`, {
      method: "PUT",
      body: JSON.stringify(reportData),
    });
  },

  deleteReport: async (reportId: string) => {
    return apiCall<void>(`/reports/${reportId}`, {
      method: "DELETE",
    });
  },
};

// Search API
export const searchAPI = {
  search: async (params: {
    query: string;
    deep?: boolean;
    entity_types?: string[];
    course_id?: string;
    professor_id?: string;
    min_rating?: number;
    max_rating?: number;
    sort_by?: string;
    sort_order?: string;
    skip?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return apiCall<any>(`/search?${searchParams.toString()}`);
  },
};

// Course API
export const courseAPI = {
  getCourses: async (skip = 0, limit = 100) => {
    return apiCall<Course[]>(`/courses/?skip=${skip}&limit=${limit}`);
  },

  getCourse: async (courseCode: string) => {
    return apiCall<Course>(`/courses/by-code/${courseCode}`);
  },

  getCourseReviews: async (courseId: string, skip = 0, limit = 100) => {
    return apiCall<Review[]>(
      `/reviews/?course_id=${courseId}&skip=${skip}&limit=${limit}`
    );
  },
};

// Professor API
export const professorAPI = {
  getProfessors: async (skip = 0, limit = 100) => {
    return apiCall<Professor[]>(`/professors?skip=${skip}&limit=${limit}`);
  },

  getProfessor: async (professorId: string) => {
    return apiCall<Professor>(`/professors/${professorId}`);
  },

  getProfessorReviews: async (professorId: string, skip = 0, limit = 100) => {
    return apiCall<Review[]>(
      `/professors/${professorId}/reviews?skip=${skip}&limit=${limit}`
    );
  },
};

// Verification API
export const verificationAPI = {
  initiate: async () => {
    return apiCall<{
      cas_url: string;
      session_token: string;
      expires_in_minutes: number;
    }>("/verify/initiate", {
      method: "POST",
    });
  },

  getStatus: async () => {
    return apiCall<{ is_muffled: boolean; username: string; echoes: number }>(
      "/verify/status"
    );
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: async (
    params: {
      skip?: number;
      limit?: number;
      unread_only?: boolean;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Notification[]>(`/notifications?${searchParams.toString()}`);
  },

  getNotification: async (notificationId: string) => {
    return apiCall<Notification>(`/notifications/${notificationId}`);
  },

  updateNotification: async (
    notificationId: string,
    notificationData: {
      is_read?: boolean;
    }
  ) => {
    return apiCall<Notification>(`/notifications/${notificationId}`, {
      method: "PUT",
      body: JSON.stringify(notificationData),
    });
  },

  markAsRead: async (notificationId: string) => {
    return apiCall<Notification>(`/notifications/${notificationId}`, {
      method: "PUT",
      body: JSON.stringify({ is_read: true }),
    });
  },

  markAllAsRead: async () => {
    return apiCall<{ message: string }>("/notifications/mark-all-read", {
      method: "PUT",
    });
  },

  deleteNotification: async (notificationId: string) => {
    return apiCall<void>(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },
};

// User Search API
export const userSearchAPI = {
  searchUsers: async (query: string) => {
    return apiCall<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  },
};
