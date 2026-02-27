"use client";

import { use, useState } from "react";
import { ConsultationDetail } from "@/components/consultations/consultation-detail";
import { ReviewList } from "@/components/clinical-reviews/review-list";
import { ClinicalReviewModal } from "@/components/consultations/clinical-review-modal";
import { RoleGate } from "@/components/auth/role-gate";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { useQueryClient } from "@tanstack/react-query";
import { FileEdit } from "lucide-react";

function ReviewSection({
  consultationId,
  hasImages,
}: {
  consultationId: string;
  hasImages: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: practitioners } = usePractitioners();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const currentPractitioner = practitioners?.find(
    (p) => p.user_id === user?.user_id
  );
  const isApprovedPractitioner =
    currentPractitioner?.approval_status === "APPROVED";
  const isSpecialist =
    currentPractitioner?.practitioner_type === "SPECIALIST";
  const showAddReview =
    hasImages && isApprovedPractitioner && user?.role === "PRACTITIONER";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Clinical Reviews
            </h2>
            <RoleGate roles={["PRACTITIONER"]}>
              {showAddReview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewModalOpen(true)}
                >
                  <FileEdit className="mr-1 h-4 w-4" />
                  Add review
                </Button>
              )}
            </RoleGate>
          </div>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <ReviewList consultationId={consultationId} />
        </div>
      </Card>

      <ClinicalReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        consultationId={consultationId}
        canMarkFinal={!!isSpecialist}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["clinical-reviews", consultationId],
          });
        }}
      />
    </div>
  );
}

export default function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ consultationId: string }>;
}) {
  const { consultationId } = use(params);

  return (
    <ConsultationDetail
      consultationId={consultationId}
      reviewSection={(hasImages) => (
        <ReviewSection
          consultationId={consultationId}
          hasImages={hasImages}
        />
      )}
    />
  );
}
