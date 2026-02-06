"use client";

import { use } from "react";
import { ConsultationDetail } from "@/components/consultations/consultation-detail";
import { ReviewList } from "@/components/clinical-reviews/review-list";
import { ReviewForm } from "@/components/clinical-reviews/review-form";
import { RoleGate } from "@/components/auth/role-gate";
import { Card, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";

function ReviewSection({ consultationId }: { consultationId: string }) {
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();

  // Find if current user is a practitioner and what type
  const currentPractitioner = practitioners?.find(
    (p) => p.user_id === user?.user_id
  );
  const isApprovedPractitioner =
    currentPractitioner?.approval_status === "APPROVED";
  const isSpecialist =
    currentPractitioner?.practitioner_type === "SPECIALIST";

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">
          Clinical Reviews
        </h2>
      </CardHeader>
      <div className="px-6 pb-6 space-y-4">
        <ReviewList consultationId={consultationId} />
        <RoleGate roles={["PRACTITIONER"]}>
          {isApprovedPractitioner && (
            <ReviewForm
              consultationId={consultationId}
              canMarkFinal={isSpecialist}
            />
          )}
        </RoleGate>
      </div>
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
