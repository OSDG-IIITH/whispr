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
 * Hook for fetching courses with caching
 */
export function useCourses(skip = 0, limit = 100) {
    const { data, error, isLoading, mutate } = useSWR<Course[]>(
        `${API_BASE}/courses?skip=${skip}&limit=${limit}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: STALE_TIMES.courses,
        }
    );

    return {
        courses: data || [],
        isLoading,
        isError: !!error,
        error,
        mutate,
    };
}

/**
 * Hook for fetching professors with caching
 */
export function useProfessors(skip = 0, limit = 100) {
    const { data, error, isLoading, mutate } = useSWR<Professor[]>(
        `${API_BASE}/professors?skip=${skip}&limit=${limit}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: STALE_TIMES.professors,
        }
    );

    return {
        professors: data || [],
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
