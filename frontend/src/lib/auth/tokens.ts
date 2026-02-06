import { AUTH_STORAGE_KEYS } from "./constants";
import type { TokenPayload } from "@/types/auth";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, access);
  localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
}

export function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}
