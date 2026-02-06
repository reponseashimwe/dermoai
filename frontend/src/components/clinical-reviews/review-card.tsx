import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Stethoscope } from "lucide-react";
import type { ClinicalReview } from "@/types/api";

interface ReviewCardProps {
  review: ClinicalReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className={review.is_final ? "border-green-200 bg-green-50/50" : ""}>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              Clinical Review
            </span>
          </div>
          <div className="flex items-center gap-2">
            {review.is_final && (
              <Badge variant="safe">
                <CheckCircle2 className="h-3 w-3" />
                Final
              </Badge>
            )}
            <span className="text-xs text-slate-400">
              {formatDate(review.created_at)}
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-900">Diagnosis</p>
          <p className="text-sm text-slate-600">{review.diagnosis}</p>
        </div>

        {review.treatment_plan && (
          <div>
            <p className="text-sm font-medium text-slate-900">Treatment Plan</p>
            <p className="text-sm text-slate-600">{review.treatment_plan}</p>
          </div>
        )}

        {review.notes && (
          <div>
            <p className="text-sm font-medium text-slate-900">Notes</p>
            <p className="text-sm text-slate-600">{review.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
