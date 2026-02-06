"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchClient } from "@/lib/api/client";
import { setTokens, clearTokens, getAccessToken } from "@/lib/auth/tokens";
import type { User, TokenResponse, RegisterRequest } from "@/types/api";
import type { AuthContextValue } from "@/types/auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await fetchClient<User>("/api/users/me");
      setUser(me);
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await fetchClient<TokenResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });
      setTokens(data.access_token, data.refresh_token);
      await refreshUser();
    },
    [refreshUser]
  );

  const register = useCallback(
    async (registerData: Omit<RegisterRequest, "role"> & { role: string }) => {
      await fetchClient<User>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registerData),
        skipAuth: true,
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
