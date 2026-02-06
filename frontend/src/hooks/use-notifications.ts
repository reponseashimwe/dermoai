"use client";

import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "@/lib/api/notifications";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}
