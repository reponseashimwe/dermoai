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
  Zap,
} from "lucide-react";
import { DASHBOARD_CONFIG } from "@/config/roles";
import type { AdminStats } from "@/types/api";
import { formatConditionName } from "@/lib/utils";

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

      {/* Row 1: 5 stat cards in a row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center gap-3 px-4 py-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <UsersRound className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-slate-900 sm:text-2xl">{s.total_patients}</p>
              <p className="text-sm text-slate-500">Total Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center gap-3 px-4 py-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-slate-900 sm:text-2xl">{s.total_consultations}</p>
              <p className="text-sm text-slate-500">Consultations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center gap-3 px-4 py-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <ScanLine className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-slate-900 sm:text-2xl">{s.total_images}</p>
              <p className="text-sm text-slate-500">Total Scans</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center gap-3 px-4 py-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                {s.telemed_stats.teleconsultations_total}
              </p>
              <p className="text-sm text-slate-500">Teleconsultations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center gap-3 px-4 py-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                {(s.model_stats.avg_confidence * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-slate-500">Avg Confidence</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Scans overview + model confidence + consent rate + top conditions */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Scans Overview</h2>
              <p className="text-sm text-slate-500">All images in the system</p>
            </div>
            <Link href="/admin/images">
              <Button
                size="sm"
                variant="outline"
                className="border-primary-600 bg-primary-50 text-xs font-medium text-primary-700 hover:bg-primary-100"
              >
                Browse all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid grid-cols-2 divide-x divide-y divide-slate-200">
            <div className="space-y-1 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                  <ScanLine className="h-4 w-4 text-primary-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {(s.total_images ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Total Scans</p>
              <p className="text-xs font-medium text-primary-600">All time</p>
            </div>
            <div className="space-y-1 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {(s.total_images - s.quick_scan_count).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">In Consultations</p>
              <p className="text-xs font-medium text-amber-700">Linked cases</p>
            </div>
            <div className="space-y-1 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Zap className="h-4 w-4 text-slate-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {(s.quick_scan_count ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Quick Scans</p>
              <p className="text-xs font-medium text-slate-900">Standalone</p>
            </div>
            <div className="space-y-1 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {s.model_stats.low_confidence_count.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Low Confidence</p>
              <p className="text-xs font-medium text-red-700">Needs review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Model Confidence</h2>
            <p className="text-sm text-slate-500">Prediction quality distribution</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-6">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <path
                    className="text-slate-200"
                    stroke="currentColor"
                    strokeWidth="3.8"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary-600"
                    stroke="currentColor"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${(s.model_stats.avg_confidence * 100).toFixed(1)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-slate-900">
                    {(s.model_stats.avg_confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-500">Avg</span>
                </div>
              </div>
              <div className="flex-1 space-y-1 text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {s.model_stats.total_predictions.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">total predictions</p>
                <p className="text-xs text-primary-600">~ Stable · last 8 weeks</p>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                { label: "Low (<40%)", value: s.model_stats.confidence_distribution.low, color: "bg-slate-400" },
                {
                  label: "Medium (40–60%)",
                  value: s.model_stats.confidence_distribution.medium,
                  color: "bg-amber-500",
                },
                { label: "Good (60–80%)", value: s.model_stats.confidence_distribution.good, color: "bg-blue-500" },
                { label: "High (>80%)", value: s.model_stats.confidence_distribution.high, color: "bg-primary-600" },
              ].map((bin) => {
                const total = s.model_stats.total_predictions || 1;
                const percentage = ((bin.value / total) * 100).toFixed(0);
                return (
                  <div key={bin.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${bin.color}`} />
                      <span className="text-slate-700">{bin.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${bin.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-medium text-slate-900">{bin.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Consent Rate</h2>
            <p className="text-sm text-slate-500">Model improvement sharing</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <path
                    className="text-slate-200"
                    stroke="currentColor"
                    strokeWidth="3.8"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary-600"
                    stroke="currentColor"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${s.consent_stats.total > 0 ? ((s.consent_stats.consented / s.consent_stats.total) * 100).toFixed(1) : 0}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-slate-900">
                    {s.consent_stats.total > 0
                      ? ((s.consent_stats.consented / s.consent_stats.total) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                  <span className="text-xs text-slate-500">RATE</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary-600" />
                  <span className="text-slate-700">Consented</span>
                </div>
                <span className="font-medium text-slate-900">{s.consent_stats.consented}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-slate-700">Not consented</span>
                </div>
                <span className="font-medium text-slate-900">{s.consent_stats.not_consented}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="font-medium text-slate-700">Total</span>
                <span className="font-semibold text-slate-900">{s.consent_stats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Conditions Breakdown</h2>
            <p className="text-sm text-slate-500">Most diagnosed</p>
          </CardHeader>
          <CardContent className="py-4">
            {s.top_conditions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No conditions data yet</p>
            ) : (
              <ol className="space-y-4 text-sm">
                {s.top_conditions.map((c, index) => {
                  const maxCount = s.top_conditions[0]?.count || 1;
                  const barColor = [
                    "bg-primary-600",
                    "bg-slate-500",
                    "bg-amber-500",
                    "bg-amber-400",
                    "bg-blue-500",
                  ][index % 5];
                  return (
                    <li key={c.name} className="flex items-center gap-2">
                      <span className="w-3 text-xs font-medium text-slate-500">{index + 1}</span>
                      <span className="flex-1 font-medium text-slate-900">{formatConditionName(c.name)}</span>
                      <div className={`h-1.5 w-24 rounded-full bg-slate-100`}>
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{
                            width: `${Math.min(100, (c.count / maxCount) * 100).toFixed(0)}%`,
                          }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs tabular-nums font-medium text-slate-900">
                        {c.count}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Patients by Province + Case Disposition + Teleconsultations & Appointments */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-slate-200">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Patients by Province</h2>
            <p className="text-sm text-slate-500">Top district shown per province</p>
          </CardHeader>
          <CardContent>
            <LocationChart data={s.location_stats} />
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Case Disposition</h2>
            <p className="text-sm text-slate-500">How consultations were resolved</p>
          </CardHeader>
          <CardContent>
            <DispositionChart data={s.disposition_stats} />
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Teleconsultations & Appointments</h2>
            <p className="text-sm text-slate-500">Scheduled and completed</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <div className="pr-6">
                <p className="text-sm text-slate-500">Teleconsultations</p>
                <p className="mt-1 text-4xl font-bold text-amber-600">
                  {s.telemed_stats.teleconsultations_total.toLocaleString()}
                </p>
              </div>
              <div className="pl-6">
                <p className="text-sm text-slate-500">Appointments</p>
                <p className="mt-1 text-4xl font-bold text-primary-600">
                  {s.telemed_stats.appointments_total.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
              {[
                { label: "Completed", value: s.telemed_stats.status.completed, color: "bg-primary-600" },
                { label: "Pending", value: s.telemed_stats.status.pending, color: "bg-amber-500" },
                { label: "Scheduled", value: s.telemed_stats.status.active, color: "bg-blue-500" },
              ].map((status) => (
                <div key={status.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-block h-3 w-3 rounded-full ${status.color}`} />
                    <span className="text-base font-medium text-slate-900">{status.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${status.color}`}
                        style={{
                          width: `${
                            s.telemed_stats.teleconsultations_total > 0
                              ? ((status.value / s.telemed_stats.teleconsultations_total) * 100).toFixed(0)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-base tabular-nums font-bold text-slate-900">{status.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
