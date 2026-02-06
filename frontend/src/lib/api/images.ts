import { fetchClient } from "./client";
import type { Image, ImageUploadResponse, AttachImageRequest } from "@/types/api";

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

export async function deleteImage(imageId: string): Promise<void> {
  return fetchClient<void>(`/api/images/${imageId}`, { method: "DELETE" });
}
