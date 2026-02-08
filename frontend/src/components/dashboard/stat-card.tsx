"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

const colorClasses = {
  blue: "text-blue-600 bg-blue-100",
  green: "text-green-600 bg-green-100",
  amber: "text-amber-600 bg-amber-100",
  purple: "text-purple-600 bg-purple-100",
  red: "text-red-600 bg-red-100",
} as const;

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: keyof typeof colorClasses;
  trend?: { value: number; direction: "up" | "down" };
}

export function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClasses[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
          {trend != null && (
            <p
              className={`mt-0.5 text-xs font-medium ${
                trend.direction === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
