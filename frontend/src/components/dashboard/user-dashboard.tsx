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
import { History, FileText, Clock, ScanLine } from "lucide-react";
import type { UserStats } from "@/types/api";

export function UserDashboard() {
  const { data: stats, isLoading } = useUserStats(true);
  const { data: consultations } = useConsultations();

  // Patients see only their own consultations (API is scoped); no urgent alerts section
  const recentConsultations = consultations?.slice(0, 5) ?? [];

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3 gap-y-4 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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

      <div className="grid grid-cols-2 gap-3 gap-y-4 sm:gap-4 lg:grid-cols-4">
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
        <Link href="/scan-history" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-2 py-3 px-3 sm:gap-3 sm:py-4 sm:px-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 sm:h-9 sm:w-9">
                <ScanLine className="h-4 w-4 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-slate-900 sm:text-xl">New</p>
                <p className="text-xs text-slate-500 sm:text-sm">Scan</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Scan + Recent Consultations: two cols on large screens */}
      <div className="grid gap-6 lg:grid-cols-2">
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
            {recentConsultations.length === 0 ? (
              <p className="text-sm text-slate-500">No consultations yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {recentConsultations.map((c) => (
                  <ConsultationCard key={c.consultation_id} consultation={c} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
