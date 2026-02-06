"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationList() {
  const { data: notifications, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!notifications?.length) {
    return (
      <EmptyState
        icon={<Bell className="h-10 w-10" />}
        title="No notifications"
        description="You're all caught up!"
      />
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <Card key={n.notification_id}>
          <CardContent className="flex items-center gap-4 py-3">
            <div className="flex-1">
              <p className="text-sm text-slate-700">{n.message}</p>
              {n.sent_at && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatDate(n.sent_at)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={n.status === "PENDING" ? "info" : "default"}>
                {n.status}
              </Badge>
              {n.consultation_id && (
                <Link
                  href={`/consultations/${n.consultation_id}`}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  View
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
