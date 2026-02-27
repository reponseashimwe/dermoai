"use client";

import { useRouter } from "next/navigation";
import { useScanHistory } from "@/hooks/use-scan-history";
import { useUpdateImageConsent } from "@/hooks/use-images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatConditionName, formatConfidence, formatDate } from "@/lib/utils";
import { Camera } from "lucide-react";

export function ScanHistoryList() {
  const router = useRouter();
  const { data: scans, isLoading } = useScanHistory();
  const updateConsent = useUpdateImageConsent();

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
        action={{
          label: "Do a quick scan",
          onClick: () => router.push("/dashboard"),
        }}
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
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={scan.consent_to_reuse}
                  onChange={(e) => {
                    updateConsent.mutate({
                      imageId: scan.image_id,
                      consent: e.target.checked,
                    });
                  }}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600"
                />
                <span className="text-slate-600">Allow use for model improvement</span>
              </label>
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
