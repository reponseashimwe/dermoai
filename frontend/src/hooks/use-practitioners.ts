"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPractitioners,
  listPendingPractitioners,
  listAvailablePractitioners,
  updateMyStatus,
  approveOrReject,
} from "@/lib/api/practitioners";
import type { ApprovalAction, PractitionerStatusUpdate } from "@/types/api";

export function usePractitioners() {
  return useQuery({
    queryKey: ["practitioners"],
    queryFn: listPractitioners,
  });
}

export function usePendingPractitioners() {
  return useQuery({
    queryKey: ["practitioners", "pending"],
    queryFn: listPendingPractitioners,
  });
}

export function useAvailablePractitioners(params?: {
  practitioner_type?: string;
  online_only?: boolean;
}) {
  return useQuery({
    queryKey: ["practitioners", "available", params ?? {}],
    queryFn: () => listAvailablePractitioners(params),
  });
}

export function useUpdateMyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PractitionerStatusUpdate) => updateMyStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practitioners"] });
    },
  });
}

export function useApprovePractitioner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      practitionerId,
      action,
    }: {
      practitionerId: string;
      action: ApprovalAction;
    }) => approveOrReject(practitionerId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practitioners"] });
    },
  });
}
