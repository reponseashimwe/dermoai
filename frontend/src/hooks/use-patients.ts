"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPatients,
  getPatient,
  getMyPatient,
  createPatient,
  updatePatient,
} from "@/lib/api/patients";
import type { PatientCreate, PatientUpdate } from "@/types/api";

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: listPatients,
  });
}

export function useMyPatient(enabled = true) {
  return useQuery({
    queryKey: ["patients", "me"],
    queryFn: getMyPatient,
    enabled,
  });
}

export function usePatient(patientId: string) {
  return useQuery({
    queryKey: ["patients", patientId],
    queryFn: () => getPatient(patientId),
    enabled: !!patientId,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PatientCreate) => createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patients", "me"] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientUpdate }) =>
      updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
