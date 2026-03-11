"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateConsultation } from "@/hooks/use-consultations";
import { useToast } from "@/components/ui/toast";

interface ReferConsultationModalProps {
  open: boolean;
  onClose: () => void;
  consultationId: string;
  onSuccess?: () => void;
}

export function ReferConsultationModal({
  open,
  onClose,
  consultationId,
  onSuccess,
}: ReferConsultationModalProps) {
  const updateConsultation = useUpdateConsultation();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateConsultation.mutateAsync({
        id: consultationId,
        data: {
          urgency: "REFER",
          status: "CLOSED",
          disposition: "REFERRED_TO_CLINIC",
          referral_note: note.trim() || undefined,
        },
      });
      toast("Consultation referred and closed", "success");
      onSuccess?.();
      onClose();
      setNote("");
    } catch {
      toast("Could not refer consultation", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Refer consultation"
      description="Add a short note about why this case is being referred."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          label="Referral note"
          placeholder="Reason for referral, suggested destination, or brief context (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isSubmitting}>
            Refer & close
          </Button>
        </div>
      </form>
    </Modal>
  );
}

