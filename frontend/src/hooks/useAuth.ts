"use client";

import { useState, useEffect } from "react";
import type { User } from "@/types";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("Checking authentication...");
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });

      console.log("Auth check response status:", response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log("User data received:", userData);
        // Map backend user data to frontend User type
        const mappedUser: User = {
          id: userData.id,
          username: userData.username,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          student_since_year: userData.student_since_year,
          is_muffled: userData.is_muffled,
          is_admin: userData.is_admin,
          echoes: userData.echoes,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        };
        console.log("Mapped user:", mappedUser);
        setUser(mappedUser);
      } else {
        console.log("Auth check failed, setting user to null");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          username,
          password
        }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Login failed");
      }

      await checkAuth();
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    setLoading(true);
    try {
      console.log("Registering user:", username);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        }),
        credentials: "include"
      });

      console.log("Registration response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Registration error data:", errorData);
        throw new Error(errorData.detail || "Registration failed");
      }

      console.log("Registration successful, checking auth...");
      // Registration now returns a token and automatically logs the user in
      // We need to fetch the user data after successful registration
      await checkAuth();
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  const refresh = async () => {
    await checkAuth();
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    refresh
  };
}