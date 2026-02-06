"use client";

import { Card, CardContent } from "@/components/ui/card";
import { usePendingPractitioners } from "@/hooks/use-practitioners";
import { useUsers } from "@/hooks/use-users";
import { useRetrainingLogs } from "@/hooks/use-retraining-logs";
import { UserCheck, Users, Brain } from "lucide-react";

export function AdminStatsCards() {
  const { data: pending } = usePendingPractitioners();
  const { data: users } = useUsers();
  const { data: logs } = useRetrainingLogs();

  const latestLog = logs?.[0];

  const stats = [
    {
      label: "Pending Approvals",
      value: pending?.length ?? "-",
      icon: UserCheck,
      color: "text-amber-600 bg-amber-100",
    },
    {
      label: "Total Users",
      value: users?.length ?? "-",
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Latest Model",
      value: latestLog?.model_version ?? "None",
      icon: Brain,
      color: "text-purple-600 bg-purple-100",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 pt-6">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
