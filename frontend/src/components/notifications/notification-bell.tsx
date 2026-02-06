"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export function NotificationBell() {
  const { data: notifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications?.filter((n) => n.status === "PENDING").length || 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Notifications
            </p>
          </div>
          <div className="max-h-64 overflow-auto">
            {!notifications?.length ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                No notifications
              </p>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.notification_id}
                  className={cn(
                    "border-b border-slate-100 px-4 py-3 last:border-0",
                    n.status === "PENDING" && "bg-blue-50/50"
                  )}
                >
                  <p className="text-sm text-slate-700">{n.message}</p>
                  {n.sent_at && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDate(n.sent_at)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-slate-200 px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
