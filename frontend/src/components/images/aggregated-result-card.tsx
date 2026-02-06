import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { UrgencyBadge } from "@/components/scan/urgency-badge";
import { formatConditionName } from "@/lib/utils";
import type { Consultation } from "@/types/api";

interface AggregatedResultCardProps {
  consultation: Consultation;
}

export function AggregatedResultCard({
  consultation,
}: AggregatedResultCardProps) {
  if (!consultation.final_predicted_condition) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-slate-500">
          Upload images to get an aggregated AI prediction.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={
        consultation.urgency === "URGENT"
          ? "border-red-200"
          : "border-green-200"
      }
    >
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Aggregated Prediction
            </p>
            <h3 className="text-lg font-bold text-slate-900">
              {formatConditionName(consultation.final_predicted_condition)}
            </h3>
          </div>
          {consultation.urgency && (
            <UrgencyBadge
              urgency={consultation.urgency as "URGENT" | "NON_URGENT"}
            />
          )}
        </div>
        {consultation.final_confidence !== null && (
          <ProgressBar
            value={consultation.final_confidence}
            urgency={consultation.urgency as "URGENT" | "NON_URGENT" | undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}
