"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listReviewsForConsultation,
  createReview,
} from "@/lib/api/clinical-reviews";
import type { ClinicalReviewCreate } from "@/types/api";

export function useConsultationReviews(consultationId: string) {
  return useQuery({
    queryKey: ["clinical-reviews", consultationId],
    queryFn: () => listReviewsForConsultation(consultationId),
    enabled: !!consultationId,
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
