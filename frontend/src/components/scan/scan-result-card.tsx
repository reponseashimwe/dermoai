"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { UrgencyBadge } from "./urgency-badge";
import { ConditionInfoPanel } from "./condition-info-panel";
import { formatConditionName } from "@/lib/utils";
import { CONDITION_INFO } from "@/lib/constants/conditions";
import type { QuickScanResponse } from "@/types/api";

interface ScanResultCardProps {
  result: QuickScanResponse;
}

export function ScanResultCard({ result }: ScanResultCardProps) {
  const conditionInfo = CONDITION_INFO[result.predicted_condition];
  const displayName = conditionInfo?.displayName || formatConditionName(result.predicted_condition);

  return (
    <Card className="overflow-hidden">
      <div
        className={
          result.urgency === "URGENT"
            ? "border-t-4 border-red-500"
            : "border-t-4 border-green-500"
        }
      />
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">Predicted Condition</p>
            <h3 className="text-xl font-bold text-slate-900">{displayName}</h3>
          </div>
          <UrgencyBadge urgency={result.urgency} />
        </div>

        <div className="flex items-center gap-4">
          <img
            src={result.image_url}
            alt="Uploaded skin image"
            className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
          />
          <div className="flex-1">
            <ProgressBar value={result.confidence} urgency={result.urgency} />
          </div>
        </div>

        <ConditionInfoPanel condition={result.predicted_condition} />

        {result.urgency === "URGENT" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Important:</strong> This result suggests a condition that
            may require urgent medical attention. Please consult a healthcare
            provider as soon as possible.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
