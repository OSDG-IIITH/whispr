"use client";

import { useState, useEffect } from "react";
import { authAPI } from "@/lib/api";
import type { User } from "@/lib/api";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Add a focus event listener to re-fetch user data when the user
    // returns to the tab
    window.addEventListener("focus", checkAuth);
    return () => window.removeEventListener("focus", checkAuth);
  }, []);

  const checkAuth = async () => {
    try {
      console.log("Checking authentication...");
      const userData = await authAPI.getCurrentUser();
      console.log("User data received:", userData);
      setUser(userData);
    } catch {
      console.log("Auth check failed, setting user to null");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      await authAPI.login(username, password);
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
      await authAPI.register(username, password);
      console.log("Registration successful, checking auth...");
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
      await authAPI.logout();
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