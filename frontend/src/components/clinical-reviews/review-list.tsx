"use client";

import { useConsultationReviews } from "@/hooks/use-clinical-reviews";
import { ReviewCard } from "./review-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import type { ClinicalReview, Practitioner } from "@/types/api";

interface ReviewListProps {
  consultationId: string;
  currentPractitioner?: Practitioner | null;
  onEditReview?: (review: ClinicalReview) => void;
}

export function ReviewList({ consultationId, currentPractitioner, onEditReview }: ReviewListProps) {
  const { data: reviews, isLoading } = useConsultationReviews(consultationId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
        <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" />
        <span>No reviews yet. Clinical reviews from practitioners will appear here.</span>
      </div>
    );
  }

  // Show final reviews first
  const sorted = [...reviews].sort((a, b) => {
    if (a.is_final && !b.is_final) return -1;
    if (!a.is_final && b.is_final) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-3">
      {sorted.map((review) => (
        <ReviewCard
          key={review.review_id}
          review={review}
          currentPractitioner={currentPractitioner}
          onEdit={onEditReview}
        />
      ))}
    </div>
  );
}
