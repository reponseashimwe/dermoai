"use client";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Stethoscope, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClinicalReview } from "@/types/api";
import type { Practitioner } from "@/types/api";

interface ReviewCardProps {
  review: ClinicalReview;
  currentPractitioner?: Practitioner | null;
  onEdit?: (review: ClinicalReview) => void;
}

export function ReviewCard({ review, currentPractitioner, onEdit }: ReviewCardProps) {
  const canEdit = currentPractitioner && review.practitioner_id === currentPractitioner.practitioner_id && onEdit;

  function handleClick() {
    if (canEdit) onEdit(review);
  }

  return (
    <div
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onClick={canEdit ? handleClick : undefined}
      onKeyDown={canEdit ? (e) => e.key === "Enter" && handleClick() : undefined}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 space-y-3 transition-all shadow-sm",
        canEdit && "cursor-pointer hover:border-primary-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{review.diagnosis}</p>
            {review.practitioner_name && (
              <p className="text-sm text-slate-500 mt-0.5">by {review.practitioner_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {review.is_final && (
            <Badge variant="safe" className="text-xs">
              <CheckCircle2 className="h-3 w-3" />
              Final
            </Badge>
          )}
          <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
          {canEdit && (
            <span className="rounded-full bg-primary-100 p-1.5 text-primary-600" title="Click to edit">
              <Edit2 className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      {review.treatment_plan && (
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Treatment plan</p>
          <p className="text-sm text-slate-700">{review.treatment_plan}</p>
        </div>
      )}

      {review.notes && (
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-slate-700">{review.notes}</p>
        </div>
      )}
    </div>
  );
}
