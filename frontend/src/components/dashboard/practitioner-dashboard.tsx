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
import { FileText, ClipboardCheck, AlertTriangle, Users, CheckSquare, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PractitionerStats } from "@/types/api";

export function PractitionerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();
  const { data: stats, isLoading } = usePractitionerStats(true);
  const { data: consultations } = useConsultations();
  const { data: incomingCalls, refetch: refetchIncoming } = useIncomingTeleconsultations();
  const acceptCall = useAcceptTeleconsultation();
  const updateStatus = useUpdateMyStatus();

  const currentPractitioner = user
    ? practitioners?.find((p) => p.user_id === user.user_id)
    : undefined;
  const isOnline = updateStatus.data?.is_online ?? currentPractitioner?.is_online ?? false;

  const urgentConsultations =
    consultations?.filter((c) => c.urgency === "URGENT") ?? [];

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
    <div className="flex min-h-0 flex-col gap-4 pb-6 md:max-h-[calc(100vh-4rem)] md:overflow-hidden">
      {/* Header with online toggle */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-slate-600">Your practice overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">
            {isOnline ? "🟢 Online" : "⚫ Offline"}
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
      </div>

      {/* Stats grid: 2x2 on small, 4 cols on md+ */}
      <div className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="My Reviews"
          value={s.my_reviews}
          icon={ClipboardCheck}
          color="green"
        />
        <StatCard
          label="Pending"
          value={s.pending_consultations}
          icon={FileText}
          color="amber"
        />
        <StatCard
          label="Urgent"
          value={s.urgent_cases}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Patients"
          value={s.patients_seen || 0}
          icon={Users}
          color="blue"
        />
      </div>

      {/* Main content: stack on small, 2 columns on md+ */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:overflow-hidden">
        {/* Left: Urgent queue - compact cards */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Urgent Queue ({urgentConsultations.length})
              </h2>
              <Link href="/consultations?filter=urgent">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {urgentConsultations.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No urgent cases
              </p>
            ) : (
              <div className="space-y-2">
                {urgentConsultations.slice(0, 5).map((c) => (
                  <Link
                    key={c.consultation_id}
                    href={`/consultations/${c.consultation_id}`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {c.final_predicted_condition?.replace(/_/g, " ") || "Pending"}
                          </p>
                          <p className="text-xs text-slate-600">
                            {new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          URGENT
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Incoming calls + Quick actions */}
        <div className="flex min-h-0 flex-col gap-3 overflow-auto md:min-h-0">
          {incomingCalls && incomingCalls.length > 0 && (
            <Card className="border-primary-200 bg-primary-50/30">
              <CardHeader className="pb-2">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary-600" />
                  Incoming video calls ({incomingCalls.length})
                </h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {incomingCalls.slice(0, 3).map((tc) => (
                  <div
                    key={tc.teleconsultation_id}
                    className="flex items-center justify-between rounded-lg border border-primary-200 bg-white p-2"
                  >
                    <span className="text-sm text-slate-600">Incoming request</span>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await acceptCall.mutateAsync(tc.teleconsultation_id);
                          refetchIncoming();
                          router.push(`/teleconsultations/${tc.teleconsultation_id}`);
                        } catch {
                          refetchIncoming();
                        }
                      }}
                      disabled={acceptCall.isPending}
                    >
                      Accept
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Link href="/review-queue">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Review Queue</h3>
                  <p className="text-xs text-slate-500">Review and classify images</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/patients">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">My Patients</h3>
                  <p className="text-xs text-slate-500">View patient list</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/consultations/new">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">New Consultation</h3>
                  <p className="text-xs text-slate-500">Start a new case</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer transition-shadow hover:shadow-md opacity-90">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Request Teleconsult</h3>
                <p className="text-xs text-slate-500">Call a specialist</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
