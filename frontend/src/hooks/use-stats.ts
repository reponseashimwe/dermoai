"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminStats,
  getPractitionerStats,
  getUserStats,
} from "@/lib/api/stats";
import type { AdminStats, PractitionerStats, UserStats } from "@/types/api";
import { useAuth } from "@/hooks/use-auth";

export function useAdminStats(enabled = true) {
  return useQuery<AdminStats>({
    queryKey: ["stats", "admin"],
    queryFn: getAdminStats,
    staleTime: 60 * 1000,
    enabled,
  });
}

export function usePractitionerStats(enabled = true) {
  return useQuery<PractitionerStats>({
    queryKey: ["stats", "practitioner"],
    queryFn: getPractitionerStats,
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useUserStats(enabled = true) {
  return useQuery<UserStats>({
    queryKey: ["stats", "user"],
    queryFn: getUserStats,
    staleTime: 60 * 1000,
    enabled,
  });
}

/** Returns dashboard stats for the current user role (one request). */
export function useDashboardStats() {
  const { user } = useAuth();
  const role = user?.role;

  return useQuery({
    queryKey: ["stats", "dashboard", role ?? ""],
    queryFn: async () => {
      if (role === "ADMIN") return getAdminStats();
      if (role === "PRACTITIONER") return getPractitionerStats();
      return getUserStats();
    },
    enabled: !!role,
    staleTime: 60 * 1000,
  });
}
