"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { UrgencyBadge } from "./urgency-badge";
import { ConditionInfoPanel } from "./condition-info-panel";
import { formatConditionName, formatConfidence } from "@/lib/utils";
import { CONDITION_INFO } from "@/lib/constants/conditions";
import { Video, FileText } from "lucide-react";
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
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              URGENT: Immediate attention recommended
            </p>
            <p>
              Predicted: {displayName} (Confidence: {formatConfidence(result.confidence)}).
              Consult with a specialist immediately or schedule an in-person examination.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/telemedicine">
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  <Video className="mr-1 h-4 w-4" />
                  View available practitioners
                </Button>
              </Link>
              <Link href="/telemedicine">
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  Start telemedicine consultation
                </Button>
              </Link>
              <Link href="/consultations/new">
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  <FileText className="mr-1 h-4 w-4" />
                  Save to my consultations
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
