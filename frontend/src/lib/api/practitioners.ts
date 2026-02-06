import { fetchClient } from "./client";
import type { Practitioner, PractitionerUpdate, ApprovalAction } from "@/types/api";

export async function listPractitioners(): Promise<Practitioner[]> {
  return fetchClient<Practitioner[]>("/api/practitioners/");
}

export async function getPractitioner(
  practitionerId: string
): Promise<Practitioner> {
  return fetchClient<Practitioner>(`/api/practitioners/${practitionerId}`);
}

export async function updatePractitioner(
  practitionerId: string,
  data: PractitionerUpdate
): Promise<Practitioner> {
  return fetchClient<Practitioner>(`/api/practitioners/${practitionerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function listPendingPractitioners(): Promise<Practitioner[]> {
  return fetchClient<Practitioner[]>("/api/practitioners/pending");
}

export async function approveOrReject(
  practitionerId: string,
  data: ApprovalAction
): Promise<Practitioner> {
  return fetchClient<Practitioner>(
    `/api/practitioners/${practitionerId}/approve`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}
