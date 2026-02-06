"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
} from "@/lib/api/consultations";
import type { ConsultationCreate, ConsultationUpdate } from "@/types/api";

export function useConsultations() {
  return useQuery({
    queryKey: ["consultations"],
    queryFn: listConsultations,
  });
}

export function useConsultation(consultationId: string) {
  return useQuery({
    queryKey: ["consultations", consultationId],
    queryFn: () => getConsultation(consultationId),
    enabled: !!consultationId,
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConsultationCreate) => createConsultation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConsultationUpdate }) =>
      updateConsultation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      queryClient.invalidateQueries({ queryKey: ["consultations", id] });
    },
  });
}
