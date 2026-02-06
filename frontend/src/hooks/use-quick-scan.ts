"use client";

import { useMutation } from "@tanstack/react-query";
import { triageScan } from "@/lib/api/triage";
import type { QuickScanResponse } from "@/types/api";

export function useQuickScan() {
  return useMutation<
    QuickScanResponse,
    Error,
    { file: File; consentToReuse: boolean }
  >({
    mutationFn: ({ file, consentToReuse }) => triageScan(file, consentToReuse),
  });
}
