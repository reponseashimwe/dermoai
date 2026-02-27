"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/use-stats";
import { usePendingPractitioners } from "@/hooks/use-practitioners";
import { PendingPractitionerList } from "@/components/practitioners/pending-practitioner-list";
import { DispositionChart } from "@/components/dashboard/charts/disposition-chart";
import { LocationChart } from "@/components/dashboard/charts/location-chart";
import { ConsentChart } from "@/components/dashboard/charts/consent-chart";
import { OutcomeChart } from "@/components/dashboard/charts/outcome-chart";
import { ModelConfidenceChart } from "@/components/dashboard/charts/model-confidence-chart";
import { ConfidenceDistributionChart } from "@/components/dashboard/charts/confidence-distribution-chart";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import {
  Users,
  UserCheck,
  Stethoscope,
  FileText,
  Image,
  UsersRound,
  UserCog,
  ScanLine,
  AlertTriangle,
} from "lucide-react";
import { DASHBOARD_CONFIG } from "@/config/roles";
import type { AdminStats } from "@/types/api";

export function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: pending } = usePendingPractitioners();

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats as AdminStats;
  const config = DASHBOARD_CONFIG.ADMIN;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ministry of Health Dashboard"
        description={config.description}
      />

      {/* Row 1: 4 stat cards in a row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard compact label="Users" value={s.total_users} icon={Users} color="blue" />
        <StatCard compact label="Practitioners" value={s.total_practitioners} icon={Stethoscope} color="green" />
        <StatCard compact label="Consultations" value={s.total_consultations} icon={FileText} color="blue" />
        <StatCard compact label="Patients" value={s.total_patients} icon={UsersRound} color="purple" />
      </div>

      {/* Row 2: 8 content cards, 4 per row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Model Confidence</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <ModelConfidenceChart
              data={s.model_stats.confidence_trend}
              avgConfidence={s.model_stats.avg_confidence}
              embedded
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Confidence Distribution</h2>
          </CardHeader>
          <CardContent>
            <ConfidenceDistributionChart data={s.model_stats.confidence_distribution} embedded />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Disposition</h2>
          </CardHeader>
          <CardContent>
            <DispositionChart data={s.disposition_stats} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Outcome by Disposition</h2>
          </CardHeader>
          <CardContent>
            <OutcomeChart data={s.outcome_by_disposition} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Location</h2>
          </CardHeader>
          <CardContent>
            <LocationChart data={s.location_stats} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Consent</h2>
          </CardHeader>
          <CardContent>
            <ConsentChart data={s.consent_stats} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Pending & Activity</h2>
            {s.pending_approvals > 0 && (
              <Link href="/admin/practitioners">
                <Button variant="outline" size="sm">View all</Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {s.pending_approvals > 0 && <PendingPractitionerList limit={2} />}
            {s.recent_activity.length > 0 && (
              <ActivityTimeline items={s.recent_activity} maxItems={5} />
            )}
            {s.pending_approvals === 0 && s.recent_activity.length === 0 && (
              <p className="text-sm text-slate-500">No pending approvals or recent activity</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/practitioners" className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Practitioner Approvals</h3>
                <p className="text-sm text-slate-500">Review pending practitioners</p>
              </div>
            </Link>
            <Link href="/admin/users" className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">User Management</h3>
                <p className="text-sm text-slate-500">View and manage users</p>
              </div>
            </Link>
            <Link href="/admin/images" className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <Image className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">All Images</h3>
                <p className="text-sm text-slate-500">Browse uploaded images</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
