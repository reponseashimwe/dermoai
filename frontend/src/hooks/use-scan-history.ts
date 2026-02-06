"use client";

import { useQuery } from "@tanstack/react-query";
import { triageHistory } from "@/lib/api/triage";

export function useScanHistory() {
  return useQuery({
    queryKey: ["scan-history"],
    queryFn: triageHistory,
  });
}
