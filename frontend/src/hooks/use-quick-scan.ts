"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { triageScan } from "@/lib/api/triage";
import type { QuickScanResponse } from "@/types/api";

export function useQuickScan() {
  const queryClient = useQueryClient();
  return useMutation<
    QuickScanResponse,
    Error,
    { file: File; consentToReuse: boolean }
  >({
    mutationFn: ({ file, consentToReuse }) => triageScan(file, consentToReuse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
    },
  });
}
