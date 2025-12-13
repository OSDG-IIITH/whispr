"use client";

import { useState, useEffect } from "react";
import { authAPI } from "@/lib/api";
import type { User } from "@/lib/api";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFocusCheck, setLastFocusCheck] = useState<number>(0);

  useEffect(() => {
    checkAuth();

    // Add a focus event listener to re-fetch user data when the user
    // returns to the tab, but don't set loading state to avoid re-renders
    const handleFocus = () => {
      // Only check auth if it's been more than 3000 seconds since last check
      const now = Date.now();
      if (now - lastFocusCheck > 3000000) {
        setLastFocusCheck(now);
        checkAuthOnFocus();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [lastFocusCheck]);

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

  // Silent auth check on focus - doesn't trigger loading state
  const checkAuthOnFocus = async () => {
    try {
      console.log("Silent auth check on focus...");
      const userData = await authAPI.getCurrentUser();
      console.log("User data received on focus:", userData);

      // Only update user state if the data has actually changed
      setUser((prevUser: User | null) => {
        if (!prevUser && !userData) return prevUser;
        if (!prevUser && userData) return userData;
        if (prevUser && !userData) return null;

        // Compare key properties to avoid unnecessary updates
        if (prevUser && userData &&
          prevUser.id === userData.id &&
          prevUser.username === userData.username &&
          prevUser.echoes === userData.echoes &&
          prevUser.is_muffled === userData.is_muffled &&
          prevUser.is_banned === userData.is_banned) {
          return prevUser; // No change, keep previous state
        }

        return userData;
      });
    } catch {
      console.log("Silent auth check failed, setting user to null");
      setUser((prevUser: User | null) => prevUser === null ? prevUser : null);
    }
    // Don't set loading to false here since we never set it to true
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