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
  subtext?: string;
  /** Compact style for top row (4 per row) */
  compact?: boolean;
}

export function StatCard({ label, value, icon: Icon, color, trend, subtext, compact }: StatCardProps) {
  return (
    <Card>
      <CardContent
        className={
          compact
            ? "flex items-center gap-3 py-4 px-4"
            : "flex items-center gap-2 py-3 px-3 sm:gap-3 sm:py-4 sm:px-4"
        }
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg ${
            compact ? "h-9 w-9" : "h-8 w-8 sm:h-9 sm:w-9"
          } ${colorClasses[color]}`}
        >
          <Icon className={compact ? "h-4 w-4" : "h-4 w-4 sm:h-4 sm:w-4"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={compact ? "text-lg font-bold text-slate-900" : "text-lg font-bold text-slate-900 sm:text-xl"}>
            {value}
          </p>
          <p className={compact ? "text-sm text-slate-500" : "text-xs text-slate-500 sm:text-sm"}>
            {label}
            {subtext != null && subtext !== "" && (
              <span className="text-slate-400"> · {subtext}</span>
            )}
          </p>
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
