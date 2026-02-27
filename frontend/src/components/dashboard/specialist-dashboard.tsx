"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePractitionerStats } from "@/hooks/use-stats";
import { useUnreviewedImages } from "@/hooks/use-images";
import { useConsultations } from "@/hooks/use-consultations";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners, useUpdateMyStatus } from "@/hooks/use-practitioners";
import { useIncomingTeleconsultations, useAcceptTeleconsultation } from "@/hooks/use-teleconsultations";
import { usePendingAppointmentCount, useIncomingAppointmentRequests } from "@/hooks/use-appointments";
import {
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Users,
  CheckSquare,
  Phone,
  Stethoscope,
  Calendar,
} from "lucide-react";
import { SPECIALIST_DASHBOARD_CONFIG } from "@/config/roles";
import { formatDate } from "@/lib/utils";
import type { PractitionerStats } from "@/types/api";

export function SpecialistDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();
  const { data: stats, isLoading } = usePractitionerStats(true);
  const { data: unreviewedData } = useUnreviewedImages({ skip: 0, limit: 1 });
  const { data: consultations } = useConsultations();
  const { data: incomingCalls, refetch: refetchIncoming } = useIncomingTeleconsultations();
  const { data: pendingAppointmentCount } = usePendingAppointmentCount();
  const { data: appointmentRequests } = useIncomingAppointmentRequests();
  const acceptCall = useAcceptTeleconsultation();
  const updateStatus = useUpdateMyStatus();

  const currentPractitioner = user
    ? practitioners?.find((p) => p.user_id === user.user_id)
    : undefined;
  const isOnline = updateStatus.data?.is_online ?? currentPractitioner?.is_online ?? false;

  const pendingReviewCount = unreviewedData?.total ?? 0;
  const urgentConsultations = consultations?.filter((c) => c.urgency === "URGENT") ?? [];
  const pendingAppointments = appointmentRequests?.slice(0, 3) ?? [];

  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats as PractitionerStats;
  const config = SPECIALIST_DASHBOARD_CONFIG;

  return (
    <div className="flex min-h-0 flex-col gap-4 pb-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Specialist Dashboard</h1>
          <p className="text-sm text-slate-600">{config.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">{isOnline ? "Online" : "Offline"}</span>
          <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ is_online: !isOnline })} loading={updateStatus.isPending}>
            Go {isOnline ? "Offline" : "Online"}
          </Button>
        </div>
      </div>

      {/* Row 1: 4 stat cards in a row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard compact label="Pending Review" value={pendingReviewCount} icon={CheckSquare} color="amber" />
        <StatCard compact label="Appointments" value={pendingAppointmentCount ?? 0} icon={Calendar} color="purple" subtext="Requests" />
        <StatCard compact label="Urgent Cases" value={s.urgent_cases} icon={AlertTriangle} color="red" />
        <StatCard compact label="My Reviews" value={s.my_reviews} icon={ClipboardCheck} color="green" />
      </div>

      {/* Row 2: content cards, 4 per row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/review-queue" className="block">
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-md border-primary-200 bg-primary-50/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Review Queue</h2>
                <p className="text-sm text-slate-600">
                  {pendingReviewCount === 0 ? "No images waiting." : `${pendingReviewCount} image${pendingReviewCount !== 1 ? "s" : ""} awaiting classification.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Urgent Cases</h2>
              <Link href="/consultations?filter=urgent">
                <Button variant="ghost" size="sm" className="h-7 text-xs">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {urgentConsultations.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No urgent cases</p>
            ) : (
              <div className="space-y-2">
                {urgentConsultations.slice(0, 4).map((c) => (
                  <Link key={c.consultation_id} href={`/consultations/${c.consultation_id}`} className="block">
                    <div className="rounded-lg border border-slate-200 p-2.5 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{c.final_predicted_condition?.replace(/_/g, " ") || "Pending"}</p>
                        <span className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">URGENT</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Appointments & Quick links</h2>
              <Link href="/appointments" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAppointments.length > 0 ? (
              <div className="space-y-2">
                {pendingAppointments.slice(0, 2).map((req) => (
                  <Link key={req.request_id} href="/appointments" className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
                    <p className="text-sm font-medium text-slate-900">{formatDate(req.proposed_datetime)}</p>
                    {req.notes && <p className="text-xs text-slate-600 truncate">{req.notes}</p>}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-2 text-center text-sm text-slate-500">No pending requests</p>
            )}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <Link href="/review-queue" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-primary-300 hover:bg-primary-50/30">
                <Stethoscope className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-slate-900">Classify images</span>
              </Link>
              <Link href="/patients" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-primary-300 hover:bg-primary-50/30">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-900">Patients</span>
              </Link>
              <Link href="/consultations" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-primary-300 hover:bg-primary-50/30">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-slate-900">Consultations</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
