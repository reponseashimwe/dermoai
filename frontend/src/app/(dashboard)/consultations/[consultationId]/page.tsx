"use client";

import { use, useState } from "react";
import { ConsultationDetail } from "@/components/consultations/consultation-detail";
import { ReviewList } from "@/components/clinical-reviews/review-list";
import { ReviewForm } from "@/components/clinical-reviews/review-form";
import { RoleGate } from "@/components/auth/role-gate";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { Plus } from "lucide-react";

function ReviewSection({ consultationId }: { consultationId: string }) {
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();

  const currentPractitioner = practitioners?.find(
    (p) => p.user_id === user?.user_id
  );
  const isApprovedPractitioner =
    currentPractitioner?.approval_status === "APPROVED";
  const isSpecialist =
    currentPractitioner?.practitioner_type === "SPECIALIST";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-lg font-semibold text-slate-900">
          Clinical Reviews
        </h2>
        <RoleGate roles={["PRACTITIONER"]}>
          {isApprovedPractitioner && (
            <Button
              size="sm"
              onClick={() => setAddReviewOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Review
            </Button>
          )}
        </RoleGate>
      </CardHeader>
      <div className="px-6 pb-6 space-y-4">
        <ReviewList consultationId={consultationId} />
      </div>
      <Modal
        open={addReviewOpen}
        onClose={() => setAddReviewOpen(false)}
        title="Add Clinical Review"
      >
        <ReviewForm
          consultationId={consultationId}
          canMarkFinal={isSpecialist}
          inModal
          onSuccess={() => setAddReviewOpen(false)}
        />
      </Modal>
    </Card>
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
      reviewSection={<ReviewSection consultationId={consultationId} />}
    />
  );
}
