"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { QuickScanModal } from "@/components/scan/quick-scan-modal";
import { useUserStats } from "@/hooks/use-stats";
import { useConsultations } from "@/hooks/use-consultations";
import { useAppointmentsForMyConsultations, useStartCallFromAppointment } from "@/hooks/use-appointments";
import { useToast } from "@/components/ui/toast";
import { History, FileText, Clock, Scan, AlertTriangle, Calendar, Video, User } from "lucide-react";
import { DASHBOARD_CONFIG } from "@/config/roles";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UserStats } from "@/types/api";

export function UserDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const { data: stats, isLoading } = useUserStats(true);
  const { data: consultations } = useConsultations();
  const { data: appointments } = useAppointmentsForMyConsultations();
  const startCall = useStartCallFromAppointment();

  const recentConsultations = consultations?.slice(0, 5) ?? [];
  const upcomingAppointments = appointments?.slice(0, 3) ?? [];

  async function handleAppointmentCall(requestId: string) {
    try {
      const data = await startCall.mutateAsync(requestId);
      router.push(`/teleconsultations/${data.teleconsultation_id}`);
    } catch {
      toast("Could not start call. Try the Call page if no specialist is assigned.", "error");
    }
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-3 gap-y-4 sm:gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats as UserStats;

  const config = DASHBOARD_CONFIG.USER;

  return (
    <div className="space-y-6">
      <PageHeader title="Your Health Dashboard" description={config.description} />

      {/* Second line: 3 stat cards only */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard compact label="My Scans" value={s.my_scans} icon={History} color="blue" />
        <StatCard compact label="Consultations" value={s.my_consultations} icon={FileText} color="green" />
        <StatCard compact label="Pending Results" value={s.pending_results} icon={Clock} color="amber" />
      </div>

      {(s.urgent_alerts > 0 || (appointments && appointments.length > 0)) && (
        <div className="flex flex-col gap-2">
          {s.urgent_alerts > 0 && (
            <Link href="/consultations">
              <Alert variant="warning" className="cursor-pointer transition-opacity hover:opacity-95">
                <span className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  You have {s.urgent_alerts} urgent notification{s.urgent_alerts !== 1 ? "s" : ""}.{" "}
                  <span className="underline">View consultations</span>
                </span>
              </Alert>
            </Link>
          )}
          {appointments && appointments.length > 0 && (
            <Link href="/schedules">
              <Alert variant="info" className="cursor-pointer transition-opacity hover:opacity-95 border-primary-200 bg-primary-50/50">
                <span className="flex items-center gap-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  You have {appointments.length} upcoming appointment{appointments.length !== 1 ? "s" : ""}.{" "}
                  <span className="underline">View schedules</span>
                </span>
              </Alert>
            </Link>
          )}
        </div>
      )}

      {/* Content row: 3 columns — Get started (Quick Scan + Start consultation), Recent Consultations, Schedules */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Get started</h2>
            <p className="text-sm text-slate-500">
              Quick scan or start a consultation for specialist review.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              type="button"
              onClick={() => setQuickScanOpen(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <Scan className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Quick Scan</p>
                <p className="text-xs text-slate-500">Upload for instant AI analysis</p>
              </div>
            </button>
            <Link
              href="/consultations/new"
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Start a consultation</p>
                <p className="text-xs text-slate-500">Create a consultation for specialist review</p>
              </div>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Consultations</h2>
            <Link href="/consultations" className="text-sm font-medium text-primary-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentConsultations.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500">No consultations yet.</p>
                <Link href="/consultations/new" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline">
                  Create your first consultation
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentConsultations.slice(0, 3).map((c) => (
                  <ConsultationCard key={c.consultation_id} consultation={c} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card id="schedules">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Schedules</h2>
            <Link href="/schedules" className="text-sm font-medium text-primary-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="py-6 text-center">
                <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No scheduled appointments yet
                </p>
                <p className="text-xs text-slate-400">Appointments linked to your consultations appear here.</p>
                <Link
                  href="/schedules"
                  className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline"
                >
                  View schedules
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.request_id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(apt.proposed_datetime)}
                        </p>
                        {apt.specialist_name && (
                          <p className="flex items-center gap-1 text-xs text-slate-600">
                            <User className="h-3 w-3 shrink-0" />
                            {apt.specialist_name}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="mt-0.5 text-xs text-slate-500">{apt.notes}</p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          apt.status === "APPROVED" && "bg-green-100 text-green-800",
                          apt.status === "PENDING" && "bg-amber-100 text-amber-800",
                          apt.status === "REJECTED" && "bg-red-100 text-red-800",
                          apt.status === "RESCHEDULED" && "bg-blue-100 text-blue-800"
                        )}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {apt.consultation_id && (
                        <>
                          <Link
                            href={`/consultations/${apt.consultation_id}`}
                            className="text-xs text-primary-600 hover:underline"
                          >
                            Consultation
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 shrink-0 p-0"
                            onClick={() => handleAppointmentCall(apt.request_id)}
                            loading={startCall.isPending}
                            title="Video call"
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <QuickScanModal open={quickScanOpen} onClose={() => setQuickScanOpen(false)} />
    </div>
  );
}
