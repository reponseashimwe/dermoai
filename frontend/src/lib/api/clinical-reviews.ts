import { fetchClient } from "./client";
import type { ClinicalReview, ClinicalReviewCreate, ClinicalReviewUpdate } from "@/types/api";

export async function createReview(
  data: ClinicalReviewCreate
): Promise<ClinicalReview> {
  return fetchClient<ClinicalReview>("/api/clinical-reviews/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listReviewsForConsultation(
  consultationId: string
): Promise<ClinicalReview[]> {
  return fetchClient<ClinicalReview[]>(
    `/api/clinical-reviews/consultation/${consultationId}`
  );
}

export async function getReview(reviewId: string): Promise<ClinicalReview> {
  return fetchClient<ClinicalReview>(`/api/clinical-reviews/${reviewId}`);
}

export async function updateReview(
  reviewId: string,
  data: ClinicalReviewUpdate
): Promise<ClinicalReview> {
  return fetchClient<ClinicalReview>(`/api/clinical-reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
