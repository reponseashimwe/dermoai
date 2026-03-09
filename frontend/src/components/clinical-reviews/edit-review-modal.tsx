"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateReview } from "@/hooks/use-clinical-reviews";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import type { ClinicalReview } from "@/types/api";

const editReviewSchema = z.object({
  diagnosis: z.string().min(1, "Diagnosis is required"),
  treatment_plan: z.string().optional(),
  notes: z.string().optional(),
});

type EditReviewFormData = z.infer<typeof editReviewSchema>;

interface EditReviewModalProps {
  open: boolean;
  onClose: () => void;
  review: ClinicalReview | null;
  onSuccess?: () => void;
}

export function EditReviewModal({
  open,
  onClose,
  review,
  onSuccess,
}: EditReviewModalProps) {
  const updateReview = useUpdateReview();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditReviewFormData>({
    resolver: zodResolver(editReviewSchema) as never,
  });

  useEffect(() => {
    if (review) {
      reset({
        diagnosis: review.diagnosis,
        treatment_plan: review.treatment_plan || "",
        notes: review.notes || "",
      });
    }
  }, [review, reset]);

  async function onSubmit(data: EditReviewFormData) {
    if (!review) return;
    try {
      await updateReview.mutateAsync({
        reviewId: review.review_id,
        data: {
          diagnosis: data.diagnosis,
          treatment_plan: data.treatment_plan || undefined,
          notes: data.notes || undefined,
        },
      });
      toast("Review updated", "success");
      onSuccess?.();
    } catch (err) {
      if (isApiError(err)) {
        toast(err.detail, "error");
      } else {
        toast("Failed to update review", "error");
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Review" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textarea
          label="Diagnosis"
          placeholder="Condition or diagnosis"
          error={errors.diagnosis?.message}
          rows={2}
          {...register("diagnosis")}
        />

        <Textarea
          label="Treatment Plan"
          placeholder="Recommended treatment, medication, follow-up..."
          error={errors.treatment_plan?.message}
          rows={3}
          {...register("treatment_plan")}
        />

        <Textarea
          label="Clinical Notes"
          placeholder="Additional observations, patient history..."
          error={errors.notes?.message}
          rows={3}
          {...register("notes")}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={updateReview.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
