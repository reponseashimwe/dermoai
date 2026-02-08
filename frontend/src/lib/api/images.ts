import { fetchClient } from "./client";
import type {
  Image,
  ImageListResponse,
  ImageUploadResponse,
  AttachImageRequest,
} from "@/types/api";

export interface ListUnreviewedParams {
  skip?: number;
  limit?: number;
}

export interface ListAllImagesParams {
  skip?: number;
  limit?: number;
  consultation_id?: string;
  uploaded_by?: string;
  date_from?: string;
  date_to?: string;
}

export async function uploadToConsultation(
  file: File,
  consultationId: string
): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchClient<ImageUploadResponse>(
    `/api/images/upload?consultation_id=${consultationId}`,
    {
      method: "POST",
      body: formData,
    }
  );
}

export async function attachToConsultation(
  imageId: string,
  consultationId: string
): Promise<Image> {
  return fetchClient<Image>(`/api/images/${imageId}/attach`, {
    method: "POST",
    body: JSON.stringify({ consultation_id: consultationId } as AttachImageRequest),
  });
}

export async function getImage(imageId: string): Promise<Image> {
  return fetchClient<Image>(`/api/images/${imageId}`);
}

export async function listConsultationImages(
  consultationId: string
): Promise<Image[]> {
  return fetchClient<Image[]>(`/api/images/consultation/${consultationId}`);
}

export async function listUnreviewedImages(
  params: ListUnreviewedParams = {}
): Promise<ImageListResponse> {
  const { skip = 0, limit = 20 } = params;
  const sp = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  return fetchClient<ImageListResponse>(`/api/images/unreviewed?${sp}`);
}

export async function listAllImages(
  params: ListAllImagesParams = {}
): Promise<ImageListResponse> {
  const sp = new URLSearchParams();
  if (params.skip != null) sp.set("skip", String(params.skip));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.consultation_id != null)
    sp.set("consultation_id", params.consultation_id);
  if (params.uploaded_by != null) sp.set("uploaded_by", params.uploaded_by);
  if (params.date_from != null) sp.set("date_from", params.date_from);
  if (params.date_to != null) sp.set("date_to", params.date_to);
  const q = sp.toString();
  return fetchClient<ImageListResponse>(
    `/api/images/all${q ? `?${q}` : ""}`
  );
}

export async function updateImageReview(
  imageId: string,
  reviewedLabel: string
): Promise<Image> {
  return fetchClient<Image>(`/api/images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify({ reviewed_label: reviewedLabel }),
  });
}

export async function deleteImage(imageId: string): Promise<void> {
  return fetchClient<void>(`/api/images/${imageId}`, { method: "DELETE" });
}
