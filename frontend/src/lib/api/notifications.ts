import { fetchClient } from "./client";
import type { Notification } from "@/types/api";

export async function listNotifications(): Promise<Notification[]> {
  return fetchClient<Notification[]>("/api/notifications/");
}
