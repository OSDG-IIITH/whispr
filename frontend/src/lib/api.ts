// API service for backend integration

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Types
export interface User {
    id: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    student_since_year?: number;
    is_muffled: boolean;
    is_admin: boolean;
    echoes: number;
    created_at: string;
    updated_at: string;
}

export interface Review {
    id: string;
    user_id: string;
    course_id?: string;
    professor_id?: string;
    course_instructor_id?: string;
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
    course_instructor?: {
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
    };
}

export interface UserUpdate {
    username?: string;
    avatar_url?: string;
    bio?: string;
    student_since_year?: number;
    password?: string;
}

export interface Vote {
    id: string;
    user_id: string;
    review_id?: string;
    reply_id?: string;
    vote_type: 'up' | 'down';
    created_at: string;
}

export interface Professor {
    id: string;
    name: string;
    lab?: string;
    review_count: number;
    average_rating: string;
    created_at: string;
    updated_at: string;
}

export interface CourseInstructor {
    id: string;
    professor_id: string;
    course_id: string;
    semester?: string;
    year?: number;
    summary?: string;
    review_count: number;
    average_rating: string;
    created_at: string;
    professor: Professor;
}

export interface Course {
    id: string;
    code: string;
    name: string;
    credits: number;
    description: string;
    average_rating: string;
    review_count: number;
    created_at: string;
    updated_at: string;
    course_instructors: CourseInstructor[];
}

// Helper function for API calls
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(`Failed to connect to server. Please check if the backend is running and accessible.`);
        }
        throw error;
    }
}

// Auth API
export const authAPI = {
    login: async (username: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        return apiCall<{ access_token: string; token_type: string }>('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });
    },

    register: async (username: string, password: string) => {
        return apiCall<{ access_token: string; token_type: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    logout: async () => {
        return apiCall<{ message: string }>('/auth/logout', {
            method: 'POST',
        });
    },

    getCurrentUser: async () => {
        return apiCall<User>('/auth/me');
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
        return apiCall<User>('/users/me', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    followUser: async (userId: string) => {
        return apiCall<User>(`/users/${userId}/follow`, {
            method: 'POST',
        });
    },

    unfollowUser: async (userId: string) => {
        return apiCall<User>(`/users/${userId}/unfollow`, {
            method: 'POST',
        });
    },
};

// Review API
export const reviewAPI = {
    getReviews: async (params: {
        skip?: number;
        limit?: number;
        course_id?: string;
        professor_id?: string;
        course_instructor_id?: string;
        user_id?: string;
    } = {}) => {
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
        return apiCall<Review>('/reviews', {
            method: 'POST',
            body: JSON.stringify(reviewData),
        });
    },

    updateReview: async (reviewId: string, reviewData: {
        rating?: number;
        content?: string;
    }) => {
        return apiCall<Review>(`/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify(reviewData),
        });
    },

    deleteReview: async (reviewId: string) => {
        return apiCall<void>(`/reviews/${reviewId}`, {
            method: 'DELETE',
        });
    },
};

// Vote API
export const voteAPI = {
    getVotes: async (params: {
        skip?: number;
        limit?: number;
        user_id?: string;
        review_id?: string;
        reply_id?: string;
    } = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, value.toString());
            }
        });

        return apiCall<Vote[]>(`/votes?${searchParams.toString()}`);
    },

    getMyVotes: async (params: {
        skip?: number;
        limit?: number;
        review_id?: string;
        reply_id?: string;
    } = {}) => {
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
        vote_type: 'up' | 'down';
    }) => {
        return apiCall<Vote>('/votes', {
            method: 'POST',
            body: JSON.stringify(voteData),
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
                    value.forEach(v => searchParams.append(key, v));
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
        return apiCall<Review[]>(`/reviews/?course_id=${courseId}&skip=${skip}&limit=${limit}`);
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
        return apiCall<Review[]>(`/professors/${professorId}/reviews?skip=${skip}&limit=${limit}`);
    },
};

// Verification API
export const verificationAPI = {
    initiate: async () => {
        return apiCall<{ cas_url: string; session_token: string; expires_in_minutes: number }>('/verify/initiate', {
            method: 'POST',
        });
    },

    getStatus: async () => {
        return apiCall<{ is_muffled: boolean; username: string; echoes: number }>('/verify/status');
    },
};

// Notification API
export interface Notification {
    id: string;
    type: "mention" | "vote" | "reply" | "rank" | "system";
    title: string;
    content: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
}

export const notificationAPI = {
    getNotifications: async () => {
        return apiCall<Notification[]>('/notifications');
    },

    markAsRead: async (notificationId: string) => {
        return apiCall<void>(`/notifications/${notificationId}/read`, {
            method: 'POST',
        });
    },

    markAllAsRead: async () => {
        return apiCall<void>('/notifications/read-all', {
            method: 'POST',
        });
    },
};

// User Search API
export const userSearchAPI = {
    searchUsers: async (query: string) => {
        return apiCall<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
    },
}; 