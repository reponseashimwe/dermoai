"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
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

			// Mark practitioners online whenever their session is active.
			if (me.role === "PRACTITIONER") {
				try {
					await fetchClient("/api/practitioners/me/status", {
						method: "PUT",
						body: JSON.stringify({ is_online: true }),
					});
				} catch {
					// Ignore failures; not critical for auth flow
				}
			}
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
		[refreshUser],
	);

	const register = useCallback(
		async (registerData: Omit<RegisterRequest, "role"> & { role: string }) => {
			const data = await fetchClient<TokenResponse>("/api/auth/register", {
				method: "POST",
				body: JSON.stringify(registerData),
				skipAuth: true,
			});
			setTokens(data.access_token, data.refresh_token);
			await refreshUser();
		},
		[refreshUser],
	);

	const logout = useCallback(() => {
		// Fire-and-forget: best-effort set practitioner offline on logout.
		// Endpoint is practitioner-only, so guard by role to avoid 403s for regular users.
		const token = getAccessToken();
		if (user?.role === "PRACTITIONER" && token) {
			(async () => {
				try {
					// Send explicit Authorization header and skipAuth so this still works
					// even if tokens are cleared immediately after.
					await fetchClient("/api/practitioners/me/status", {
						method: "PUT",
						body: JSON.stringify({ is_online: false }),
						headers: {
							Authorization: `Bearer ${token}`,
						},
						skipAuth: true,
					});
				} catch {
					// Ignore failures; logout should still proceed
				}
			})();
		}

		clearTokens();
		setUser(null);
		window.location.href = "/login";
	}, [user?.role]);

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
