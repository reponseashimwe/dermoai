"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { ScanUploadForm } from "@/components/scan/scan-upload-form";
import { useUserStats } from "@/hooks/use-stats";
import { useConsultations } from "@/hooks/use-consultations";
import { History, FileText, Clock, AlertTriangle } from "lucide-react";
import type { UserStats } from "@/types/api";

export function UserDashboard() {
  const { data: stats, isLoading } = useUserStats(true);
  const { data: consultations } = useConsultations();

  const urgentConsultations =
    consultations?.filter((c) => c.urgency === "URGENT") ?? [];
  const recentConsultations = consultations?.slice(0, 5) ?? [];

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats as UserStats;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your Health Dashboard"
        description="Quick scan and consultation overview"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="My Scans"
          value={s.my_scans}
          icon={History}
          color="blue"
        />
        <StatCard
          label="Consultations"
          value={s.my_consultations}
          icon={FileText}
          color="green"
        />
        <StatCard
          label="Pending Results"
          value={s.pending_results}
          icon={Clock}
          color="amber"
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Quick Scan</h2>
          <p className="text-sm text-slate-500">
            Upload an image for instant AI analysis
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <ScanUploadForm />
          </div>
        </CardContent>
      </Card>

      {urgentConsultations.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Urgent Alerts ({s.urgent_alerts})
            </h2>
            <Link href="/consultations">
              <span className="text-sm font-medium text-primary-600 hover:underline">
                View all
              </span>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentConsultations.slice(0, 2).map((c) => (
                <ConsultationCard key={c.consultation_id} consultation={c} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentConsultations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Consultations
            </h2>
            <Link href="/consultations">
              <span className="text-sm font-medium text-primary-600 hover:underline">
                View all
              </span>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentConsultations.map((c) => (
                <ConsultationCard key={c.consultation_id} consultation={c} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
