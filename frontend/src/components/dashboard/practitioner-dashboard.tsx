"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { usePractitionerStats } from "@/hooks/use-stats";
import { useConsultations } from "@/hooks/use-consultations";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners, useUpdateMyStatus } from "@/hooks/use-practitioners";
import { FileText, ClipboardCheck, AlertTriangle, Users, CheckSquare } from "lucide-react";
import type { PractitionerStats } from "@/types/api";

export function PractitionerDashboard() {
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();
  const { data: stats, isLoading } = usePractitionerStats(true);
  const { data: consultations } = useConsultations();
  const updateStatus = useUpdateMyStatus();

  const currentPractitioner = user
    ? practitioners?.find((p) => p.user_id === user.user_id)
    : undefined;
  const isOnline = updateStatus.data?.is_online ?? currentPractitioner?.is_online ?? false;

  const urgentConsultations =
    consultations?.filter((c) => c.urgency === "URGENT") ?? [];
  const openConsultations =
    consultations?.filter(
      (c) => c.status === "OPEN" || c.status === "IN_REVIEW"
    ) ?? [];

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

  const s = stats as PractitionerStats;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Your practice overview"
      />

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-slate-700">
          Availability: {isOnline ? "Online" : "Offline"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            updateStatus.mutate({
              is_online: !isOnline,
            })
          }
          loading={updateStatus.isPending}
        >
          Go {isOnline ? "Offline" : "Online"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="My Reviews"
          value={s.my_reviews}
          icon={ClipboardCheck}
          color="green"
        />
        <StatCard
          label="Pending Consultations"
          value={s.pending_consultations}
          icon={FileText}
          color="amber"
        />
        <StatCard
          label="Urgent Cases"
          value={s.urgent_cases}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {urgentConsultations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Urgent Consultations ({urgentConsultations.length})
            </h2>
            <Link href="/consultations">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentConsultations.slice(0, 3).map((c) => (
                <ConsultationCard key={c.consultation_id} consultation={c} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {openConsultations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Pending Reviews ({openConsultations.length})
            </h2>
            <Link href="/consultations">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openConsultations.slice(0, 5).map((c) => (
                <ConsultationCard key={c.consultation_id} consultation={c} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/review-queue">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Review Queue</h3>
                <p className="text-sm text-slate-500">
                  Review and classify images
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patients">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">My Patients</h3>
                <p className="text-sm text-slate-500">
                  View patient list
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
