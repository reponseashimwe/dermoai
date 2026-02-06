"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPractitioners,
  listPendingPractitioners,
  approveOrReject,
} from "@/lib/api/practitioners";
import type { ApprovalAction } from "@/types/api";

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
