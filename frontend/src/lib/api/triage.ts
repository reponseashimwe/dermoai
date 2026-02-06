import { fetchClient } from "./client";
import type { QuickScanResponse, Image } from "@/types/api";

export async function triageScan(
  file: File,
  consentToReuse: boolean
): Promise<QuickScanResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchClient<QuickScanResponse>(
    `/api/triage/scan?consent_to_reuse=${consentToReuse}`,
    {
      method: "POST",
      body: formData,
    }
  );
}

export async function triageHistory(): Promise<Image[]> {
  return fetchClient<Image[]>("/api/triage/history");
}
