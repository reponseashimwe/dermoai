"use client";

import { useScanHistory } from "@/hooks/use-scan-history";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatConditionName, formatConfidence, formatDate } from "@/lib/utils";
import { Camera } from "lucide-react";

export function ScanHistoryList() {
  const { data: scans, isLoading } = useScanHistory();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!scans?.length) {
    return (
      <EmptyState
        icon={<Camera className="h-12 w-12" />}
        title="No scans yet"
        description="Your quick scan history will appear here after you analyze an image."
      />
    );
  }

  return (
    <div className="space-y-3">
      {scans.map((scan) => (
        <Card key={scan.image_id}>
          <CardContent className="flex items-center gap-4 py-4">
            <img
              src={scan.image_url}
              alt="Scan"
              className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-slate-900">
                {scan.predicted_condition
                  ? formatConditionName(scan.predicted_condition)
                  : "Pending"}
              </p>
              {scan.confidence !== null && (
                <p className="text-sm text-slate-500">
                  Confidence: {formatConfidence(scan.confidence)}
                </p>
              )}
              <p className="text-xs text-slate-400">
                {formatDate(scan.uploaded_at)}
              </p>
            </div>
            {scan.predicted_condition && (
              <Badge variant={scan.source === "quick_scan" ? "info" : "default"}>
                Quick Scan
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
