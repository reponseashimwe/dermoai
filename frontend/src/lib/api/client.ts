import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth/tokens";
import { ApiError } from "./errors";
import type { TokenResponse } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Axios instance ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ── Request interceptor — attach Bearer token ───────────────────────────────
api.interceptors.request.use((config) => {
  // Skip auth for requests explicitly marked
  if ((config as AxiosRequestConfig & { skipAuth?: boolean }).skipAuth) {
    return config;
  }

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — 401 refresh + retry ──────────────────────────────
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ reject }) => reject(error));
  failedQueue = [];
}

async function retryQueue() {
  const queue = [...failedQueue];
  failedQueue = [];
  for (const { resolve, reject, config } of queue) {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    try {
      const response = await api.request(config);
      resolve(response);
    } catch (err) {
      reject(err);
    }
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      skipAuth?: boolean;
    };

    // Only attempt refresh for 401s that aren't already retries or skipAuth
    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.skipAuth) {
      return Promise.reject(error);
    }

    // Queue concurrent requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<TokenResponse>(
        `${BASE_URL}/api/auth/refresh`,
        { refresh_token: refreshToken }
      );
      setTokens(data.access_token, data.refresh_token);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

      // Retry queued requests
      await retryQueue();

      return api.request(originalRequest);
    } catch {
      processQueue(error);
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── fetchClient — drop-in replacement with same signature ───────────────────
interface FetchClientOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export async function fetchClient<T>(
  path: string,
  options: FetchClientOptions = {}
): Promise<T> {
  const { method = "GET", body, headers, skipAuth } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const config: AxiosRequestConfig & { skipAuth?: boolean } = {
    url: path,
    method,
    headers: {
      ...headers,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
    },
    data: isFormData ? body : body ? body : undefined,
    skipAuth,
  };

  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      const detail =
        error.response?.data?.detail || error.message || "Request failed";
      throw new ApiError(status, detail);
    }
    throw error;
  }
}
