"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listReviewsForConsultation,
  createReview,
  getReview,
  updateReview,
} from "@/lib/api/clinical-reviews";
import type { ClinicalReviewCreate, ClinicalReviewUpdate } from "@/types/api";

export function useConsultationReviews(consultationId: string) {
  return useQuery({
    queryKey: ["clinical-reviews", consultationId],
    queryFn: () => listReviewsForConsultation(consultationId),
    enabled: !!consultationId,
  });
}

export function useReview(reviewId: string) {
  return useQuery({
    queryKey: ["clinical-review", reviewId],
    queryFn: () => getReview(reviewId),
    enabled: !!reviewId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClinicalReviewCreate) => createReview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clinical-reviews", variables.consultation_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["consultations", variables.consultation_id],
      });
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: ClinicalReviewUpdate }) =>
      updateReview(reviewId, data),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: ["clinical-reviews", review.consultation_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["clinical-review", review.review_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["consultations", review.consultation_id],
      });
    },
  });
}
