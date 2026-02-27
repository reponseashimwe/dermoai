"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePractitionerStats } from "@/hooks/use-stats";
import { useConsultations } from "@/hooks/use-consultations";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners, useUpdateMyStatus } from "@/hooks/use-practitioners";
import { useIncomingTeleconsultations, useAcceptTeleconsultation } from "@/hooks/use-teleconsultations";
import { useUpcomingAppointments } from "@/hooks/use-appointments";
import { FileText, ClipboardCheck, AlertTriangle, Users, Phone, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { DASHBOARD_CONFIG } from "@/config/roles";
import { formatDate } from "@/lib/utils";
import type { PractitionerStats } from "@/types/api";

export function PractitionerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();
  const { data: stats, isLoading } = usePractitionerStats(true);
  const { data: consultations } = useConsultations();
  const { data: incomingCalls, refetch: refetchIncoming } = useIncomingTeleconsultations();
  const { data: upcomingAppointments } = useUpcomingAppointments();
  const acceptCall = useAcceptTeleconsultation();
  const updateStatus = useUpdateMyStatus();

  const currentPractitioner = user
    ? practitioners?.find((p) => p.user_id === user.user_id)
    : undefined;
  const isOnline = updateStatus.data?.is_online ?? currentPractitioner?.is_online ?? false;

  const urgentConsultations =
    consultations?.filter((c) => c.urgency === "URGENT") ?? [];
  const nextAppointments = upcomingAppointments?.slice(0, 3) ?? [];

  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats as PractitionerStats;

  return (
    <div className="flex min-h-0 flex-col gap-4 pb-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">General Practice</h1>
          <p className="text-sm text-slate-600">{DASHBOARD_CONFIG.PRACTITIONER.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">{isOnline ? "🟢 Online" : "⚫ Offline"}</span>
          <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ is_online: !isOnline })} loading={updateStatus.isPending}>
            Go {isOnline ? "Offline" : "Online"}
          </Button>
        </div>
      </div>

      {/* Row 1: 4 stat cards in a row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard compact label="Pending Consults" value={s.pending_consultations} icon={FileText} color="amber" />
        <StatCard compact label="Appointments" value={upcomingAppointments?.length ?? 0} icon={Calendar} color="purple" subtext="Upcoming" />
        <StatCard compact label="Urgent" value={s.urgent_cases} icon={AlertTriangle} color="red" />
        <StatCard compact label="My Reviews" value={s.my_reviews} icon={ClipboardCheck} color="green" />
      </div>

      {/* Row 2: content cards, 4 per row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Urgent Queue</h2>
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
              <h2 className="text-base font-semibold text-slate-900">Appointments & Calls</h2>
              <Link href="/appointments" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextAppointments.length > 0 && (
              <div className="space-y-2">
                {nextAppointments.slice(0, 2).map((apt) => (
                  <div key={apt.request_id} className="rounded-lg border border-slate-200 p-2.5">
                    <p className="text-sm font-medium text-slate-900">{formatDate(apt.proposed_datetime)}</p>
                    <p className="text-xs text-green-700">Approved</p>
                  </div>
                ))}
              </div>
            )}
            {incomingCalls && incomingCalls.length > 0 && (
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <p className="text-xs font-medium text-slate-600">Incoming calls ({incomingCalls.length})</p>
                {incomingCalls.slice(0, 2).map((tc) => (
                  <div key={tc.teleconsultation_id} className="flex items-center justify-between rounded border border-primary-200 bg-primary-50/50 p-2">
                    <span className="text-xs text-slate-600">Request</span>
                    <Button size="sm" onClick={async () => { try { await acceptCall.mutateAsync(tc.teleconsultation_id); refetchIncoming(); router.push(`/teleconsultations/${tc.teleconsultation_id}`); } catch { refetchIncoming(); } }} disabled={acceptCall.isPending}>Accept</Button>
                  </div>
                ))}
              </div>
            )}
            {nextAppointments.length === 0 && (!incomingCalls || incomingCalls.length === 0) && (
              <p className="py-4 text-center text-sm text-slate-500">No upcoming appointments</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/consultations/new" className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700"><FileText className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold text-slate-900">New Consultation</p><p className="text-xs text-slate-500">Start a new case</p></div>
              </div>
            </Link>
            <Link href="/patients" className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Users className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold text-slate-900">My Patients</p><p className="text-xs text-slate-500">View patient list</p></div>
              </div>
            </Link>
            <Link href="/telemedicine" className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700"><Phone className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold text-slate-900">Request Teleconsult</p><p className="text-xs text-slate-500">Connect with specialist</p></div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
