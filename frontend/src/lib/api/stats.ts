import { fetchClient } from "./client";
import type { AdminStats, PractitionerStats, UserStats } from "@/types/api";

export async function getAdminStats(): Promise<AdminStats> {
  return fetchClient<AdminStats>("/api/stats/admin");
}

export async function getPractitionerStats(): Promise<PractitionerStats> {
  return fetchClient<PractitionerStats>("/api/stats/practitioner");
}

export async function getUserStats(): Promise<UserStats> {
  return fetchClient<UserStats>("/api/stats/user");
}
