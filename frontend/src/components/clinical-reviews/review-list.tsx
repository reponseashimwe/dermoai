"use client";

import { useConsultationReviews } from "@/hooks/use-clinical-reviews";
import { ReviewCard } from "./review-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";

interface ReviewListProps {
  consultationId: string;
}

export function ReviewList({ consultationId }: ReviewListProps) {
  const { data: reviews, isLoading } = useConsultationReviews(consultationId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-10 w-10" />}
        title="No reviews yet"
        description="Clinical reviews from practitioners will appear here."
      />
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
        <ReviewCard key={review.review_id} review={review} />
      ))}
    </div>
  );
}
