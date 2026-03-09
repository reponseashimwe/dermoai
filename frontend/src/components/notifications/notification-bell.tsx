"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useAlertCount } from "@/hooks/use-alert-count";

export function NotificationBell() {
  const alertCount = useAlertCount();

  return (
    <Link
      href="/notifications"
      className="relative inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      aria-label={alertCount > 0 ? `${alertCount} alerts` : "View alerts"}
    >
      <Bell className="h-5 w-5" />
      {alertCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
          {alertCount > 99 ? "99+" : alertCount}
        </span>
      )}
    </Link>
  );
}
