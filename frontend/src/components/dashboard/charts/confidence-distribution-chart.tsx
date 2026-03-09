"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ConfidenceDistribution } from "@/types/api";

interface ConfidenceDistributionChartProps {
  data: ConfidenceDistribution;
  /** When true, render content only (no Card) for embedding in another card */
  embedded?: boolean;
}

const BINS = [
  { key: "low" as const, label: "Low (<40%)", color: "bg-red-500" },
  { key: "medium" as const, label: "Medium (40-60%)", color: "bg-amber-500" },
  { key: "good" as const, label: "Good (60-80%)", color: "bg-blue-500" },
  { key: "high" as const, label: "High (>80%)", color: "bg-primary-500" },
];

export function ConfidenceDistributionChart({ data, embedded = false }: ConfidenceDistributionChartProps) {
  const total = data.low + data.medium + data.good + data.high;

  const body = (
    <div className="space-y-3">
      {BINS.map((bin) => {
        const count = data[bin.key];
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={bin.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{bin.label}</span>
              <span className="font-medium text-slate-900">
                {count} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full ${bin.color} transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  if (total === 0) {
    return embedded ? (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Confidence Distribution</h3>
        <p className="text-sm text-slate-500">No predictions yet</p>
      </div>
    ) : (
      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-slate-900">Confidence Distribution</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No predictions yet</p>
        </CardContent>
      </Card>
    );
  }

  const header = (
    <>
      <h3 className={embedded ? "text-sm font-semibold text-slate-900" : "text-base font-semibold text-slate-900"}>
        Confidence Distribution
      </h3>
      <p className="text-sm text-slate-500">{total.toLocaleString()} total predictions</p>
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-3">
        {header}
        {body}
      </div>
    );
  }
  return (
    <Card>
      <CardHeader>{header}</CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
