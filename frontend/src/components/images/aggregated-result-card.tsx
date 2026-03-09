import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UrgencyBadge } from "@/components/scan/urgency-badge";
import { ConfidenceCircle } from "@/components/scan/confidence-circle";
import { formatConditionName } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Consultation } from "@/types/api";
import type { Image } from "@/types/api";

interface AggregatedResultCardProps {
  consultation: Consultation;
  /** When provided, weighted aggregation and conflict detection use these scans (client-side). */
  images?: Image[] | null;
}

/** Weight by confidence: each scan's top prediction gets its confidence added to that condition. Winner = condition with highest total. */
function computeWeightedAggregation(images: Image[]): {
  condition: string;
  confidence: number;
  scanCount: number;
  totalScans: number;
  hasConflict: boolean;
} {
  const withPrediction = images.filter(
    (img) => img.predicted_condition != null && img.predicted_condition.trim() !== ""
  );
  const totalScans = withPrediction.length;
  if (totalScans === 0) {
    return { condition: "", confidence: 0, scanCount: 0, totalScans: 0, hasConflict: false };
  }

  const scores: Record<string, number> = {};
  const confidences: Record<string, number[]> = {};
  for (const img of withPrediction) {
    const c = img.predicted_condition!;
    const conf = img.confidence ?? 0;
    scores[c] = (scores[c] ?? 0) + conf;
    if (!confidences[c]) confidences[c] = [];
    confidences[c].push(conf);
  }

  const entries = Object.entries(scores);
  if (entries.length === 0) {
    return { condition: "", confidence: 0, scanCount: 0, totalScans, hasConflict: false };
  }

  entries.sort((a, b) => b[1] - a[1]);
  const [winnerCondition, winnerScore] = entries[0];
  const winnerConfs = confidences[winnerCondition] ?? [];
  const avgConfidence =
    winnerConfs.length > 0
      ? winnerConfs.reduce((s, x) => s + x, 0) / winnerConfs.length
      : 0;

  const hasConflict = entries.length >= 2;

  return {
    condition: winnerCondition,
    confidence: avgConfidence,
    scanCount: winnerConfs.length,
    totalScans,
    hasConflict,
  };
}

export function AggregatedResultCard({
  consultation,
  images = null,
}: AggregatedResultCardProps) {
  const hasImages = images && images.length > 0;
  const computed = hasImages ? computeWeightedAggregation(images) : null;
  const useComputed = computed && computed.condition;

  const condition = useComputed
    ? computed.condition
    : consultation.final_predicted_condition;
  const confidence = useComputed
    ? computed.confidence
    : (consultation.final_confidence ?? 0);
  const scanCount = useComputed ? computed.scanCount : 0;
  const totalScans = useComputed ? computed.totalScans : 0;

  if (!condition && !hasImages) {
    return (
      <Card className="border border-slate-200 bg-white">
        <CardContent className="py-6 text-center text-sm text-slate-500">
          Upload images to get an aggregated AI prediction.
        </CardContent>
      </Card>
    );
  }

  if (!condition) {
    return (
      <Card className="border border-slate-200 bg-white">
        <CardContent className="py-6 text-center text-sm text-slate-500">
          Waiting for scan results to aggregate.
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round(confidence * 1000) / 10;
  const isRefer = consultation.urgency === "REFER";

  return (
    <Card
      className={cn(
        "border border-slate-200 bg-white",
        isRefer && "border-amber-200"
      )}
    >
      <CardHeader className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Aggregated Prediction
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Weighted majority diagnosis
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-center">
            <ConfidenceCircle
              value={confidence}
              urgency={isRefer ? "REFER" : "MANAGE LOCALLY"}
              size={64}
              strokeWidth={6}
            />
            <span className="mt-0.5 text-[10px] font-medium text-slate-500">
              CONF.
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {formatConditionName(condition)}
            </h3>
            {totalScans > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                {totalScans === 1
                  ? "1 scan."
                  : `${scanCount} of ${totalScans} scans • avg confidence ${pct}%`}
              </p>
            )}
            {consultation.urgency && (
              <div className="mt-2">
                <UrgencyBadge urgency={consultation.urgency} size="sm" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
