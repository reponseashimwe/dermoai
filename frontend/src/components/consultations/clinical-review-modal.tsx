"use client";

import { Modal } from "@/components/ui/modal";
import { ClinicalReviewCompleteForm } from "./clinical-review-complete-form";

interface ClinicalReviewModalProps {
  open: boolean;
  onClose: () => void;
  consultationId: string;
  canMarkFinal: boolean;
  onSuccess?: () => void;
}

export function ClinicalReviewModal({
  open,
  onClose,
  consultationId,
  canMarkFinal,
  onSuccess,
}: ClinicalReviewModalProps) {
  function handleSuccess() {
    onClose();
    onSuccess?.();
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete Clinical Review">
      <ClinicalReviewCompleteForm
        consultationId={consultationId}
        canMarkFinal={canMarkFinal}
        onSuccess={handleSuccess}
        embedded
      />
    </Modal>
  );
}
