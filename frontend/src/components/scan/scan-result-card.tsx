"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { UrgencyBadge } from "./urgency-badge";
import { ConditionInfoPanel } from "./condition-info-panel";
import { formatConditionName, formatConfidence } from "@/lib/utils";
import { CONDITION_INFO } from "@/lib/constants/conditions";
import { FileText, Eye, Sparkles } from "lucide-react";
import type { QuickScanResponse } from "@/types/api";
import type { Consultation } from "@/types/api";

interface ScanResultCardProps {
  result: QuickScanResponse;
  /** When provided, shows "Save to my consultations" and calls this on click. */
  onSaveToConsultations?: (result: QuickScanResponse) => Promise<Consultation>;
  onSaveSuccess?: (consultationId: string) => void;
  onSaveError?: (error: unknown) => void;
  isSaving?: boolean;
}

export function ScanResultCard({
  result,
  onSaveToConsultations,
  onSaveSuccess,
  onSaveError,
  isSaving = false,
}: ScanResultCardProps) {
  const [showGradCAM, setShowGradCAM] = useState(true);
  const [showAllProbs, setShowAllProbs] = useState(false);

  const conditionInfo = CONDITION_INFO[result.predicted_condition];
  const displayName = conditionInfo?.displayName || formatConditionName(result.predicted_condition);
  const hasGradCAM = !!result.gradcam_base64;
  const isRefer = result.urgency === "URGENT" || result.urgency === "REFER";

  return (
    <Card className="overflow-hidden">
      <div
        className={
          isRefer
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

        {/* Image Display with GradCAM Toggle */}
        <div className="space-y-3">
          {hasGradCAM && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!showGradCAM ? "default" : "outline"}
                onClick={() => setShowGradCAM(false)}
                className="flex-1"
              >
                <Eye className="mr-1.5 h-4 w-4" />
                Original
              </Button>
              <Button
                size="sm"
                variant={showGradCAM ? "default" : "outline"}
                onClick={() => setShowGradCAM(true)}
                className="flex-1"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Explainability
              </Button>
            </div>
          )}

          <div className="relative">
            <img
              src={showGradCAM && hasGradCAM ? result.gradcam_base64 : result.image_url}
              alt={showGradCAM && hasGradCAM ? "GradCAM explainability heatmap" : "Uploaded skin image"}
              className="w-full rounded-lg border border-slate-200 object-contain"
              style={{ maxHeight: "400px" }}
            />
            {showGradCAM && hasGradCAM && (
              <div className="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                Red = High Importance
              </div>
            )}
          </div>

          <div className="flex-1">
            <ProgressBar value={result.confidence} urgency={result.urgency} />
          </div>
        </div>

        {/* GradCAM Metrics (Optional) */}
        {showGradCAM && result.gradcam_metrics && (
          <details className="rounded-lg bg-slate-50 p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-slate-700">
              Explainability Metrics
            </summary>
            <div className="mt-2 space-y-1 text-slate-600">
              <p>
                <span className="font-medium">Peak Location:</span> (
                {result.gradcam_metrics.peak_activation_location.x},{" "}
                {result.gradcam_metrics.peak_activation_location.y})
              </p>
              <p>
                <span className="font-medium">Peak Intensity:</span>{" "}
                {(result.gradcam_metrics.peak_intensity * 100).toFixed(1)}%
              </p>
              <p>
                <span className="font-medium">Mean Activation:</span>{" "}
                {(result.gradcam_metrics.mean_activation * 100).toFixed(1)}%
              </p>
              <p>
                <span className="font-medium">Activation Area:</span>{" "}
                {(result.gradcam_metrics.activation_area * 100).toFixed(1)}% of image
              </p>
            </div>
          </details>
        )}

        {/* Model Metadata */}
        {result.model_version && (
          <div className="text-xs text-slate-500">
            Model v{result.model_version} • {result.triage_stage?.replace(/_/g, " ").toLowerCase()}
          </div>
        )}

        {/* All Probabilities */}
        {result.all_probabilities && Object.keys(result.all_probabilities).length > 1 && (
          <details
            className="rounded-lg bg-slate-50 p-3 text-sm"
            open={showAllProbs}
            onToggle={(e) => setShowAllProbs((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer font-semibold text-slate-700">
              All Condition Probabilities
            </summary>
            <div className="mt-2 space-y-1">
              {Object.entries(result.all_probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([condition, prob]) => (
                  <div key={condition} className="flex justify-between text-slate-600">
                    <span>{formatConditionName(condition)}</span>
                    <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </details>
        )}

        <ConditionInfoPanel condition={result.predicted_condition} />

        {isRefer && (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              REFER: Immediate specialist attention recommended
            </p>
            <p>
              Predicted: {displayName} (Confidence: {formatConfidence(result.confidence)}).
              Consult with a dermatology specialist immediately or schedule an in-person examination.
            </p>
            <div className="pt-2">
              {onSaveToConsultations ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  disabled={isSaving}
                  loading={isSaving}
                  onClick={async () => {
                    try {
                      const consultation = await onSaveToConsultations(result);
                      onSaveSuccess?.(consultation.consultation_id);
                    } catch (err) {
                      onSaveError?.(err);
                    }
                  }}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Save to my consultations
                </Button>
              ) : (
                <Link
                  href="/consultations/new"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-300 bg-transparent px-3 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  <FileText className="h-4 w-4" />
                  Save to my consultations
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
