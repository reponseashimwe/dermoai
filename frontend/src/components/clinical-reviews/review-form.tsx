"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConditionSelect } from "@/components/clinical-review/condition-select";
import { useCreateReview } from "@/hooks/use-clinical-reviews";
import { useConditions } from "@/hooks/use-conditions";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";

const reviewSchema = z.object({
  condition_id: z.string().min(1, "Select a condition"),
  treatment_plan: z.string().optional(),
  notes: z.string().optional(),
  is_final: z.boolean().default(false),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  consultationId: string;
  canMarkFinal: boolean;
  /** When true, render only the form (no card wrapper). Use inside a modal. */
  inModal?: boolean;
  /** Called after successful submit (e.g. to close a modal). */
  onSuccess?: () => void;
}

export function ReviewForm({ consultationId, canMarkFinal, inModal = false, onSuccess }: ReviewFormProps) {
  const createReview = useCreateReview();
  const { data: conditions } = useConditions();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema) as never,
    defaultValues: { condition_id: "" },
  });

  const conditionId = watch("condition_id");

  async function onSubmit(data: ReviewFormData) {
    const condition = conditions?.find((c) => c.condition_id === data.condition_id);
    const diagnosis = condition?.condition_name ?? "";
    if (!diagnosis) {
      setError("condition_id", { message: "Select a condition" });
      return;
    }
    try {
      await createReview.mutateAsync({
        consultation_id: consultationId,
        diagnosis,
        treatment_plan: data.treatment_plan || undefined,
        notes: data.notes || undefined,
        is_final: data.is_final,
      });
      toast("Review submitted", "success");
      reset();
      onSuccess?.();
    } catch (err) {
      if (isApiError(err)) {
        toast(err.detail, "error");
      } else {
        toast("Failed to submit review", "error");
      }
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Condition
            </label>
            <ConditionSelect
              value={conditionId}
              onChange={(value) => {
                setValue("condition_id", value);
                clearErrors("condition_id");
              }}
              allowCustom={true}
            />
            {errors.condition_id?.message && (
              <p className="text-sm text-red-600">{errors.condition_id.message}</p>
            )}
          </div>
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
  );

  if (inModal) return formContent;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">
          Add Clinical Review
        </h3>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
