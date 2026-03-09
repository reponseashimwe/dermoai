"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AlertBanners } from "@/components/dashboard/alert-banners";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-stats";
import { useAppointmentsForMyConsultations } from "@/hooks/use-appointments";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: stats } = useUserStats(!!user && user.role === "USER");
  const { data: appointments } = useAppointmentsForMyConsultations();
  const referralCount = (stats && "urgent_alerts" in stats ? stats.urgent_alerts : 0) ?? 0;
  const upcomingCount = appointments?.length ?? 0;
  const showAlerts = user?.role === "USER" && (referralCount > 0 || upcomingCount > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Referral and appointment alerts"
      />
      {showAlerts ? (
        <AlertBanners referralCount={referralCount} upcomingCount={upcomingCount} />
      ) : (
        <p className="text-sm text-slate-500">No active alerts.</p>
      )}
    </div>
  );
}
