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
} from "@/types/frontend-models";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface UserUpdate {
  username?: string;
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

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    return apiCall<{ access_token: string; token_type: string }>(
      "/auth/login/",
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
      "/auth/register/",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }
    );
  },

  logout: async () => {
    return apiCall<{ message: string }>("/auth/logout/", {
      method: "POST",
    });
  },

  getCurrentUser: async () => {
    return apiCall<User>("/auth/me/");
  },
};

// User API
export const userAPI = {
  getUsers: async (skip = 0, limit = 100) => {
    return apiCall<User[]>(`/users/?skip=${skip}&limit=${limit}`);
  },

  getLeaderboard: async (limit = 10) => {
    return apiCall<User[]>(`/users/leaderboard/?limit=${limit}`);
  },

  browseUsers: async (
    params: {
      skip?: number;
      limit?: number;
      search?: string;
      sort_by?: string;
      order?: string;
      min_echoes?: number;
      is_verified?: boolean;
      exclude_leaderboard?: boolean;
      leaderboard_limit?: number;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();

    if (params.skip !== undefined)
      searchParams.append("skip", params.skip.toString());
    if (params.limit !== undefined)
      searchParams.append("limit", params.limit.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.sort_by) searchParams.append("sort_by", params.sort_by);
    if (params.order) searchParams.append("order", params.order);
    if (params.min_echoes !== undefined)
      searchParams.append("min_echoes", params.min_echoes.toString());
    if (params.is_verified !== undefined)
      searchParams.append("is_verified", params.is_verified.toString());
    if (params.exclude_leaderboard !== undefined)
      searchParams.append(
        "exclude_leaderboard",
        params.exclude_leaderboard.toString()
      );
    if (params.leaderboard_limit !== undefined)
      searchParams.append(
        "leaderboard_limit",
        params.leaderboard_limit.toString()
      );

    return apiCall<User[]>(`/users/browse/?${searchParams.toString()}`);
  },

  getUserStats: async () => {
    return apiCall<{
      total_users: number;
      verified_users: number;
      total_echoes: number;
      average_echoes: number;
    }>("/users/stats/");
  },

  getUser: async (userId: string) => {
    return apiCall<User>(`/users/${userId}/`);
  },

  getUserByUsername: async (username: string) => {
    return apiCall<User>(`/users/by-username/${username}/`);
  },

  updateUser: async (userData: UserUpdate) => {
    return apiCall<User>("/users/me/", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  followUser: async (userId: string) => {
    return apiCall<User>(`/users/${userId}/follow/`, {
      method: "POST",
    });
  },

  unfollowUser: async (userId: string) => {
    return apiCall<User>(`/users/${userId}/unfollow/`, {
      method: "POST",
    });
  },

  getFollowers: async (userId: string, skip = 0, limit = 100) => {
    return apiCall<User[]>(
      `/users/${userId}/followers/?skip=${skip}&limit=${limit}`
    );
  },

  getFollowing: async (userId: string, skip = 0, limit = 100) => {
    return apiCall<User[]>(
      `/users/${userId}/following/?skip=${skip}&limit=${limit}`
    );
  },

  getFollowStatus: async (userId: string) => {
    return apiCall<{
      user_id: string;
      is_following: boolean;
      is_followed_by: boolean;
      followers_count: number;
      following_count: number;
    }>(`/users/${userId}/follow-status/`);
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
    Object.entries(params).forEach(([key, value]: [string, string | number | boolean | undefined]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Review[]>(`/reviews/?${searchParams.toString()}`);
  },

  getReview: async (reviewId: string) => {
    return apiCall<Review>(`/reviews/${reviewId}/`);
  },

  createReview: async (reviewData: {
    course_id?: string;
    professor_id?: string;
    course_instructor_ids?: string[];
    rating: number;
    content?: string;
  }) => {
    return apiCall<Review>("/reviews/", {
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
    return apiCall<Review>(`/reviews/${reviewId}/`, {
      method: "PUT",
      body: JSON.stringify(reviewData),
    });
  },

  deleteReview: async (reviewId: string) => {
    return apiCall<void>(`/reviews/${reviewId}/`, {
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
    Object.entries(params).forEach(([key, value]: [string, string | number | boolean | undefined]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Vote[]>(`/votes/?${searchParams.toString()}`);
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
    Object.entries(params).forEach(([key, value]: [string, string | number | boolean | undefined]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Vote[]>(`/votes/me/?${searchParams.toString()}`);
  },

  createVote: async (voteData: {
    review_id?: string;
    reply_id?: string;
    vote_type: boolean;
  }) => {
    return apiCall<Vote>("/votes/", {
      method: "POST",
      body: JSON.stringify(voteData),
    });
  },

  deleteVote: async (voteId: string) => {
    return apiCall<void>(`/votes/${voteId}/`, {
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
    Object.entries(params).forEach(([key, value]: [string, string | number | boolean | undefined]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Reply[]>(`/replies/?${searchParams.toString()}`);
  },

  getReply: async (replyId: string) => {
    return apiCall<Reply>(`/replies/${replyId}/`);
  },

  createReply: async (replyData: { review_id: string; content: string }) => {
    return apiCall<Reply>("/replies/", {
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
    return apiCall<Reply>(`/replies/${replyId}/`, {
      method: "PUT",
      body: JSON.stringify(replyData),
    });
  },

  deleteReply: async (replyId: string) => {
    return apiCall<void>(`/replies/${replyId}/`, {
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
    Object.entries(params).forEach(([key, value]: [string, string | number | boolean | undefined]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Report[]>(`/reports/?${searchParams.toString()}`);
  },

  getReport: async (reportId: string) => {
    return apiCall<Report>(`/reports/${reportId}/`);
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
    return apiCall<Report>("/reports/", {
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
    return apiCall<Report>(`/reports/${reportId}/`, {
      method: "PUT",
      body: JSON.stringify(reportData),
    });
  },

  deleteReport: async (reportId: string) => {
    return apiCall<void>(`/reports/${reportId}/`, {
      method: "DELETE",
    });
  },
};

export interface SearchApiResponse {
  results: {
    entity_type: string;
    data: User | Review | Reply | Professor | Course | CourseInstructor;
    relevance_score: number;
  }[];
  total: number;
}

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
    Object.entries(params).forEach(([key, value]: [string, string | number | boolean | string[] | undefined]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return apiCall<SearchApiResponse>(`/search/?${searchParams.toString()}`);
  },
};

// Course API
export const courseAPI = {
  getCourses: async (skip = 0, limit = 100) => {
    return apiCall<Course[]>(`/courses/?skip=${skip}&limit=${limit}`);
  },

  getCourse: async (courseCode: string) => {
    return apiCall<Course>(`/courses/by-code/${courseCode}/`);
  },

  getCourseById: async (courseId: string) => {
    return apiCall<Course>(`/courses/${courseId}/`);
  },

  getCourseReviews: async (courseId: string, skip = 0, limit = 100) => {
    return apiCall<Review[]>(
      `/reviews/?course_id=${courseId}&skip=${skip}&limit=${limit}`
    );
  },

  // Add this function to get fresh course data
  refreshCourse: async (courseId: string) => {
    return apiCall<Course>(`/courses/${courseId}/?refresh=true`);
  },
};

// Professor API
export const professorAPI = {
  getProfessors: async (skip = 0, limit = 100) => {
    return apiCall<Professor[]>(`/professors/?skip=${skip}&limit=${limit}`);
  },

  getProfessor: async (professorId: string) => {
    return apiCall<Professor>(`/professors/${professorId}/`);
  },

  getProfessorReviews: async (professorId: string, skip = 0, limit = 100) => {
    return apiCall<Review[]>(
      `/professors/${professorId}/reviews/?skip=${skip}&limit=${limit}`
    );
  },

  // Add this function to get fresh professor data
  refreshProfessor: async (professorId: string) => {
    return apiCall<Professor>(`/professors/${professorId}/?refresh=true`);
  },
};

// Verification API
export const verificationAPI = {
  initiate: async () => {
    return apiCall<{
      cas_url: string;
      session_token: string;
      expires_in_minutes: number;
    }>("/verify/initiate/", {
      method: "POST",
    });
  },

  getStatus: async () => {
    return apiCall<{ is_muffled: boolean; username: string; echoes: number }>(
      "/verify/status/"
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
    Object.entries(params).forEach(([key, value]: [string, string | number | boolean | undefined]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiCall<Notification[]>(`/notifications/?${searchParams.toString()}`);
  },

  getNotification: async (notificationId: string) => {
    return apiCall<Notification>(`/notifications/${notificationId}/`);
  },

  updateNotification: async (
    notificationId: string,
    notificationData: {
      is_read?: boolean;
    }
  ) => {
    return apiCall<Notification>(`/notifications/${notificationId}/`, {
      method: "PUT",
      body: JSON.stringify(notificationData),
    });
  },

  markAsRead: async (notificationId: string) => {
    return apiCall<Notification>(`/notifications/${notificationId}/`, {
      method: "PUT",
      body: JSON.stringify({ is_read: true }),
    });
  },

  markAllAsRead: async () => {
    return apiCall<{ message: string }>("/notifications/mark-all-read/", {
      method: "POST",
    });
  },

  deleteNotification: async (notificationId: string) => {
    return apiCall<void>(`/notifications/${notificationId}/`, {
      method: "DELETE",
    });
  },
};

// User Search API
export const userSearchAPI = {
  searchUsers: async (query: string) => {
    return apiCall<User[]>(`/users/search/?q=${encodeURIComponent(query)}`);
  },
};

// Feed API
export const feedAPI = {
  getFeed: async (skip = 0, limit = 20) => {
    return apiCall<Review[]>(`/feed/?skip=${skip}&limit=${limit}`);
  },

  getStats: async () => {
    return apiCall<{
      review_count: number;
      reply_count: number;
      vote_count: number;
      followers_count: number;
      following_count: number;
      echoes: number;
    }>("/feed/stats/");
  },
};
