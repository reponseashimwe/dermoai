"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConsultationImages,
  listUnreviewedImages,
  listAllImages,
  uploadToConsultation,
  attachToConsultation,
  updateImageReview,
  deleteImage,
} from "@/lib/api/images";
import type { ListUnreviewedParams, ListAllImagesParams } from "@/lib/api/images";

export function useConsultationImages(consultationId: string) {
  return useQuery({
    queryKey: ["consultation-images", consultationId],
    queryFn: () => listConsultationImages(consultationId),
    enabled: !!consultationId,
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, consultationId }: { file: File; consultationId: string }) =>
      uploadToConsultation(file, consultationId),
    onSuccess: (_, { consultationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["consultation-images", consultationId],
      });
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

export function useAttachImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      imageId,
      consultationId,
    }: {
      imageId: string;
      consultationId: string;
    }) => attachToConsultation(imageId, consultationId),
    onSuccess: (_, { consultationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["consultation-images", consultationId],
      });
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

export function useUpdateImageReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      imageId,
      reviewedLabel,
    }: {
      imageId: string;
      reviewedLabel: string;
    }) => updateImageReview(imageId, reviewedLabel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images", "unreviewed"] });
      queryClient.invalidateQueries({ queryKey: ["consultation-images"] });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => deleteImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation-images"] });
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

export function useUnreviewedImages(params: ListUnreviewedParams = {}) {
  return useQuery({
    queryKey: ["images", "unreviewed", params.skip ?? 0, params.limit ?? 20],
    queryFn: () => listUnreviewedImages(params),
  });
}

export function useAllImages(params: ListAllImagesParams = {}) {
  return useQuery({
    queryKey: ["images", "all", params],
    queryFn: () => listAllImages(params),
  });
}
