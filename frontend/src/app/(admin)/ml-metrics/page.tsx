"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { fetchClient } from "@/lib/api/client";
import { formatConditionName } from "@/lib/utils";
import { Brain, TrendingUp, AlertCircle, Activity } from "lucide-react";
import Link from "next/link";

interface MLMetrics {
  model_version: string;
  model_date: string;
  total_predictions: number;
  condition_distribution: Record<string, number>;
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
    uncertain: number;
  };
  triage_decision_breakdown: {
    REFER: number;
    "MANAGE LOCALLY": number;
  };
  avg_confidence_by_condition: Record<string, number>;
  uncertain_predictions: Array<{
    image_id: string;
    condition: string;
    confidence: number;
    uploaded_at: string;
  }>;
  class_names: string[];
  triage_mapping: Record<string, string>;
}

export default function MLMetricsPage() {
  const { data: metrics, isLoading } = useQuery<MLMetrics>({
    queryKey: ["ml-metrics"],
    queryFn: async () => {
      const res = await fetchClient.get<MLMetrics>("/api/stats/ml-metrics");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="ML Model Metrics"
          description="Ministry of Health - AI Model Performance Monitoring"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="ML Model Metrics"
          description="Ministry of Health - AI Model Performance Monitoring"
        />
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            No metrics available
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalTriageDecisions =
    metrics.triage_decision_breakdown.REFER +
    metrics.triage_decision_breakdown["MANAGE LOCALLY"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ML Model Metrics"
        description="Ministry of Health - AI Model Performance Monitoring"
      />

      {/* Model Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Model Version</p>
                <p className="text-2xl font-bold text-slate-900">
                  v{metrics.model_version}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {metrics.model_date}
                </p>
              </div>
              <Brain className="h-8 w-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Predictions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {metrics.total_predictions.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">All time</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">REFER Cases</p>
                <p className="text-2xl font-bold text-red-600">
                  {metrics.triage_decision_breakdown.REFER}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {totalTriageDecisions > 0
                    ? `${(
                        (metrics.triage_decision_breakdown.REFER /
                          totalTriageDecisions) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}{" "}
                  of total
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Uncertain</p>
                <p className="text-2xl font-bold text-amber-600">
                  {metrics.confidence_distribution.uncertain}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Confidence &lt; 45%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Condition Distribution */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Prediction Distribution by Condition
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.condition_distribution)
              .sort(([, a], [, b]) => b - a)
              .map(([condition, count]) => {
                const percentage =
                  (count / metrics.total_predictions) * 100;
                const triageDecision = metrics.triage_mapping[condition];
                return (
                  <div key={condition} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {formatConditionName(condition)}
                        </span>
                        <Badge
                          variant={
                            triageDecision === "REFER" ? "error" : "success"
                          }
                          className="text-xs"
                        >
                          {triageDecision}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">
                          {count.toLocaleString()} (
                          {percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${
                          triageDecision === "REFER"
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Confidence Distribution */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Confidence Distribution
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="text-3xl font-bold text-green-700">
                {metrics.confidence_distribution.high}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                High (&ge;80%)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {metrics.total_predictions > 0
                  ? (
                      (metrics.confidence_distribution.high /
                        metrics.total_predictions) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-3xl font-bold text-blue-700">
                {metrics.confidence_distribution.medium}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Medium (60-80%)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {metrics.total_predictions > 0
                  ? (
                      (metrics.confidence_distribution.medium /
                        metrics.total_predictions) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50">
              <div className="text-3xl font-bold text-yellow-700">
                {metrics.confidence_distribution.low}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Low (45-60%)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {metrics.total_predictions > 0
                  ? (
                      (metrics.confidence_distribution.low /
                        metrics.total_predictions) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50">
              <div className="text-3xl font-bold text-red-700">
                {metrics.confidence_distribution.uncertain}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Uncertain (&lt;45%)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {metrics.total_predictions > 0
                  ? (
                      (metrics.confidence_distribution.uncertain /
                        metrics.total_predictions) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triage Breakdown */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Triage Decision Breakdown
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-6 rounded-lg bg-red-50 border border-red-200">
              <div className="text-4xl font-bold text-red-700">
                {metrics.triage_decision_breakdown.REFER}
              </div>
              <div className="text-sm font-medium text-slate-700 mt-2">
                REFER to Specialist
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {totalTriageDecisions > 0
                  ? (
                      (metrics.triage_decision_breakdown.REFER /
                        totalTriageDecisions) *
                      100
                    ).toFixed(1)
                  : 0}
                % of cases
              </div>
            </div>
            <div className="text-center p-6 rounded-lg bg-green-50 border border-green-200">
              <div className="text-4xl font-bold text-green-700">
                {metrics.triage_decision_breakdown["MANAGE LOCALLY"]}
              </div>
              <div className="text-sm font-medium text-slate-700 mt-2">
                MANAGE LOCALLY
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {totalTriageDecisions > 0
                  ? (
                      (metrics.triage_decision_breakdown["MANAGE LOCALLY"] /
                        totalTriageDecisions) *
                      100
                    ).toFixed(1)
                  : 0}
                % of cases
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Confidence by Condition */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Average Confidence by Condition
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.avg_confidence_by_condition)
              .sort(([, a], [, b]) => b - a)
              .map(([condition, avgConf]) => (
                <div
                  key={condition}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-700">
                    {formatConditionName(condition)}
                  </span>
                  <span className="font-mono font-medium text-slate-900">
                    {(avgConf * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Uncertain Predictions */}
      {metrics.uncertain_predictions.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Uncertain Predictions (Confidence &lt; 45%)
            </h2>
            <p className="text-sm text-slate-500">
              These predictions may require manual review
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Image ID
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Condition
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Confidence
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.uncertain_predictions.slice(0, 10).map((pred) => (
                    <tr
                      key={pred.image_id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {pred.image_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {formatConditionName(pred.condition)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-red-600">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(pred.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/images?image_id=${pred.image_id}`}
                          className="text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {metrics.uncertain_predictions.length > 10 && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                Showing 10 of {metrics.uncertain_predictions.length} uncertain
                predictions
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
