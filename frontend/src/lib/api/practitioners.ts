import { fetchClient } from "./client";
import type {
  Practitioner,
  PractitionerAvailable,
  PractitionerUpdate,
  PractitionerStatusUpdate,
  ApprovalAction,
} from "@/types/api";

export async function listAvailablePractitioners(params?: {
  practitioner_type?: string;
  online_only?: boolean;
}): Promise<PractitionerAvailable[]> {
  const sp = new URLSearchParams();
  if (params?.practitioner_type != null)
    sp.set("practitioner_type", params.practitioner_type);
  if (params?.online_only != null)
    sp.set("online_only", String(params.online_only));
  const q = sp.toString();
  return fetchClient<PractitionerAvailable[]>(
    `/api/practitioners/available${q ? `?${q}` : ""}`
  );
}

export async function updateMyStatus(
  data: PractitionerStatusUpdate
): Promise<Practitioner> {
  return fetchClient<Practitioner>("/api/practitioners/me/status", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

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
