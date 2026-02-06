"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listLogs, createLog } from "@/lib/api/retraining-logs";
import type { RetrainingLogCreate } from "@/types/api";

export function useRetrainingLogs() {
  return useQuery({
    queryKey: ["retraining-logs"],
    queryFn: listLogs,
  });
}

export function useCreateRetrainingLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RetrainingLogCreate) => createLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retraining-logs"] });
    },
  });
}
