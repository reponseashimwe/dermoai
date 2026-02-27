"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConsultationImages,
  listUnreviewedImages,
  listReviewedImages,
  listAllImages,
  uploadToConsultation,
  attachToConsultation,
  updateImageReview,
  updateImageConsent,
  deleteImage,
} from "@/lib/api/images";
import { useToast } from "@/components/ui/toast";
import type {
  ListUnreviewedParams,
  ListReviewedParams,
  ListAllImagesParams,
} from "@/lib/api/images";

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
      queryClient.invalidateQueries({ queryKey: ["images", "reviewed"] });
      queryClient.invalidateQueries({ queryKey: ["consultation-images"] });
    },
  });
}

export function useUpdateImageConsent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      imageId,
      consent,
    }: {
      imageId: string;
      consent: boolean;
    }) => updateImageConsent(imageId, consent),
    onSuccess: (_, { imageId }) => {
      queryClient.invalidateQueries({ queryKey: ["consultation-images"] });
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      queryClient.invalidateQueries({ queryKey: ["images", imageId] });
      toast("Consent updated", "success");
    },
    onError: () => {
      toast("Failed to update consent", "error");
    },
  });
}

export function useReviewedImages(params: ListReviewedParams = {}) {
  return useQuery({
    queryKey: ["images", "reviewed", params.skip ?? 0, params.limit ?? 20],
    queryFn: () => listReviewedImages(params),
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
