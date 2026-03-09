import { fetchClient } from "./client";
import type {
  Consultation,
  ConsultationCreate,
  ConsultationUpdate,
} from "@/types/api";

export async function createConsultation(
  data: ConsultationCreate
): Promise<Consultation> {
  return fetchClient<Consultation>("/api/consultations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listConsultations(): Promise<Consultation[]> {
  return fetchClient<Consultation[]>("/api/consultations/");
}

export async function getConsultation(
  consultationId: string
): Promise<Consultation> {
  return fetchClient<Consultation>(`/api/consultations/${consultationId}`);
}

export async function updateConsultation(
  consultationId: string,
  data: ConsultationUpdate
): Promise<Consultation> {
  return fetchClient<Consultation>(`/api/consultations/${consultationId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function setConsultationImagesConsent(
  consultationId: string,
  consentToReuse: boolean
): Promise<{ updated: number }> {
  return fetchClient<{ updated: number }>(
    `/api/consultations/${consultationId}/images-consent`,
    {
      method: "PATCH",
      body: JSON.stringify({ consent_to_reuse: consentToReuse }),
    }
  );
}

export async function closeConsultation(
  consultationId: string
): Promise<Consultation> {
  return fetchClient<Consultation>(
    `/api/consultations/${consultationId}/close`,
    { method: "POST" }
  );
}

export async function reopenConsultation(
  consultationId: string
): Promise<Consultation> {
  return fetchClient<Consultation>(
    `/api/consultations/${consultationId}/reopen`,
    { method: "POST" }
  );
}

export async function listConsultationTeleconsultations(consultationId: string) {
  return fetchClient<{ teleconsultation_id: string; status: string; started_at: string | null; ended_at: string | null; duration_seconds: number | null; created_at: string }[]>(
    `/api/consultations/${consultationId}/teleconsultations`
  );
}
