"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/offline/online-status";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
      <WifiOff className="mr-2 inline h-4 w-4" />
      You are offline. Some features may be unavailable.
    </div>
  );
}
