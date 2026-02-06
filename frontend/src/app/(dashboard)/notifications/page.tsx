"use client";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationList } from "@/components/notifications/notification-list";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Your notification history"
      />
      <NotificationList />
    </div>
  );
}
