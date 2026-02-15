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
      <CardContent className="flex items-center gap-2 py-3 px-3 sm:gap-3 sm:py-4 sm:px-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${colorClasses[color]}`}
        >
          <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-slate-900 sm:text-xl">{value}</p>
          <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
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
