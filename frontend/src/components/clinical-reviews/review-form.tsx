"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCreateReview } from "@/hooks/use-clinical-reviews";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";

const reviewSchema = z.object({
  diagnosis: z.string().min(2, "Diagnosis is required"),
  treatment_plan: z.string().optional(),
  notes: z.string().optional(),
  is_final: z.boolean().default(false),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  consultationId: string;
  canMarkFinal: boolean;
}

export function ReviewForm({ consultationId, canMarkFinal }: ReviewFormProps) {
  const createReview = useCreateReview();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema) as never,
  });

  async function onSubmit(data: ReviewFormData) {
    try {
      await createReview.mutateAsync({
        consultation_id: consultationId,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatment_plan || undefined,
        notes: data.notes || undefined,
        is_final: data.is_final,
      });
      toast("Review submitted", "success");
      reset();
    } catch (err) {
      if (isApiError(err)) {
        toast(err.detail, "error");
      } else {
        toast("Failed to submit review", "error");
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">
          Add Clinical Review
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Diagnosis"
            placeholder="Clinical diagnosis"
            error={errors.diagnosis?.message}
            {...register("diagnosis")}
          />
          <Textarea
            label="Treatment Plan"
            placeholder="Recommended treatment..."
            error={errors.treatment_plan?.message}
            {...register("treatment_plan")}
          />
          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            error={errors.notes?.message}
            {...register("notes")}
          />
          {canMarkFinal && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                {...register("is_final")}
              />
              <span className="text-sm font-medium text-slate-700">
                Mark as Final Review
              </span>
              <span className="text-xs text-slate-500">
                (Closes the consultation)
              </span>
            </label>
          )}
          <Button type="submit" loading={isSubmitting}>
            Submit Review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
