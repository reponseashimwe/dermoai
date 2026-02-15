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
import {
  Users,
  UserCheck,
  Stethoscope,
  FileText,
  Image,
  UsersRound,
  UserCog,
} from "lucide-react";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Manage practitioners, users, and system overview"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Users"
          value={s.total_users}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Practitioners"
          value={s.total_practitioners}
          icon={Stethoscope}
          color="green"
        />
        <StatCard
          label="Specialists"
          value={s.total_specialists}
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          label="Consultations"
          value={s.total_consultations}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label="Images"
          value={s.total_images}
          icon={Image}
          color="green"
        />
        <StatCard
          label="Patients"
          value={s.total_patients}
          icon={UsersRound}
          color="purple"
        />
      </div>

      {s.pending_approvals > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Pending Approvals ({s.pending_approvals})
            </h2>
            <Link href="/admin/practitioners">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <PendingPractitionerList limit={3} />
          </CardContent>
        </Card>
      )}

      {s.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Activity
            </h2>
          </CardHeader>
          <CardContent>
            <ActivityTimeline items={s.recent_activity} maxItems={8} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/practitioners">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Practitioner Approvals
                </h3>
                <p className="text-sm text-slate-500">
                  Review and approve pending practitioners
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/users">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">User Management</h3>
                <p className="text-sm text-slate-500">
                  View and manage all users
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/images">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <Image className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">All Images</h3>
                <p className="text-sm text-slate-500">
                  Browse images uploaded to the system
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
