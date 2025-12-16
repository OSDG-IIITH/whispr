"use client";

/**
 * SWR-based data fetching hooks with caching
 * 
 * Benefits:
 * - Automatic caching and deduplication
 * - Stale-while-revalidate pattern
 * - Automatic revalidation on focus/reconnect
 */

import useSWR from 'swr';
import { Course, Professor, User } from '@/types/backend-models';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Generic fetcher that handles errors
async function fetcher<T>(url: string): Promise<T> {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
        const error = new Error('Failed to fetch data');
        throw error;
    }
    return res.json();
}

// SWR configuration for different data types
const STALE_TIMES = {
    courses: 60 * 1000,      // 1 minute
    professors: 60 * 1000,   // 1 minute
    leaderboard: 60 * 1000,  // 1 minute
    user: 60 * 1000,         // 1 minute
} as const;

/**
 * Hook for fetching courses with caching and filtering
 */
interface CoursesParams {
    skip?: number;
    limit?: number;
    search?: string;
    semester?: string;
    year?: string;
}

interface CoursesResponse {
    courses: Course[];
    total: number;
    skip: number;
    limit: number;
}

export function useCourses(params: CoursesParams = {}) {
    const { skip = 0, limit = 20, search = '', semester = '', year = '' } = params;

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.set('skip', skip.toString());
    queryParams.set('limit', limit.toString());
    if (search) queryParams.set('search', search);
    if (semester && semester !== 'ALL') queryParams.set('semester', semester);
    if (year && year !== 'ALL') queryParams.set('year', year);

    const { data, error, isLoading, mutate } = useSWR<CoursesResponse>(
        `${API_BASE}/courses?${queryParams.toString()}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: STALE_TIMES.courses,
        }
    );

    return {
        courses: data?.courses || [],
        total: data?.total || 0,
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}

/**
 * Hook for fetching professors with caching and filtering
 */
interface ProfessorsParams {
    skip?: number;
    limit?: number;
    search?: string;
    lab?: string;
}

interface ProfessorsResponse {
    professors: Professor[];
    total: number;
    skip: number;
    limit: number;
    labs: string[];
}

export function useProfessors(params: ProfessorsParams = {}) {
    const { skip = 0, limit = 20, search = '', lab = '' } = params;

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.set('skip', skip.toString());
    queryParams.set('limit', limit.toString());
    if (search) queryParams.set('search', search);
    if (lab && lab !== 'ALL') queryParams.set('lab', lab);

    const { data, error, isLoading, mutate } = useSWR<ProfessorsResponse>(
        `${API_BASE}/professors?${queryParams.toString()}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: STALE_TIMES.professors,
        }
    );

    return {
        professors: data?.professors || [],
        total: data?.total || 0,
        labs: data?.labs || [],
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}

/**
 * Hook for fetching leaderboard with caching
 */
export function useLeaderboard(limit = 10) {
    const { data, error, isLoading, mutate } = useSWR<User[]>(
        `${API_BASE}/users/leaderboard?limit=${limit}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: STALE_TIMES.leaderboard,
        }
    );

    return {
        users: data || [],
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}

/**
 * Hook for fetching a single course by code
 */
export function useCourse(code: string) {
    const { data, error, isLoading, mutate } = useSWR<Course>(
        code ? `${API_BASE}/courses/by-code/${code}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: STALE_TIMES.courses,
        }
    );

    return {
        course: data,
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}

/**
 * Hook for fetching a single professor by ID
 */
export function useProfessor(id: string) {
    const { data, error, isLoading, mutate } = useSWR<Professor>(
        id ? `${API_BASE}/professors/${id}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: STALE_TIMES.professors,
        }
    );

    return {
        professor: data,
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}

interface FeedStats {
    review_count: number;
    reply_count: number;
    vote_count: number;
    followers_count: number;
    following_count: number;
    echoes: number;
}

/**
 * Hook for fetching user feed stats with caching
 */
export function useStats() {
    const { data, error, isLoading, mutate } = useSWR<FeedStats>(
        `${API_BASE}/feed/stats`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: STALE_TIMES.user,
        }
    );

    return {
        stats: data || {
            review_count: 0,
            reply_count: 0,
            vote_count: 0,
            followers_count: 0,
            following_count: 0,
            echoes: 0,
        },
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}
