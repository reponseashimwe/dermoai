import { fetchClient } from "./client";
import type { User } from "@/types/api";

export async function listUsers(): Promise<User[]> {
  return fetchClient<User[]>("/api/users/");
}

export async function deactivateUser(userId: string): Promise<User> {
  return fetchClient<User>(`/api/users/${userId}/deactivate`, {
    method: "PUT",
  });
}
