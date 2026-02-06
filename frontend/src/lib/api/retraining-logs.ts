import { fetchClient } from "./client";
import type { RetrainingLog, RetrainingLogCreate } from "@/types/api";

export async function createLog(
  data: RetrainingLogCreate
): Promise<RetrainingLog> {
  return fetchClient<RetrainingLog>("/api/retraining-logs/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listLogs(): Promise<RetrainingLog[]> {
  return fetchClient<RetrainingLog[]>("/api/retraining-logs/");
}

export async function getLog(logId: string): Promise<RetrainingLog> {
  return fetchClient<RetrainingLog>(`/api/retraining-logs/${logId}`);
}
