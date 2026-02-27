"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConditionSelect } from "@/components/clinical-review/condition-select";
import { useCreateReview } from "@/hooks/use-clinical-reviews";
import { useUpdateConsultation } from "@/hooks/use-consultations";
import { useConditions } from "@/hooks/use-conditions";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import { AlertTriangle, CheckCircle2, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const DISPOSITIONS = [
  {
    value: "TREATED_LOCALLY",
    label: "Treated Locally",
    icon: CheckCircle2,
    color: "green",
  },
  {
    value: "TELEMEDICINE_ONLY",
    label: "Telemedicine Only",
    icon: Stethoscope,
    color: "blue",
  },
  {
    value: "REFERRED_TO_CLINIC",
    label: "Referred to Clinic",
    icon: AlertTriangle,
    color: "amber",
  },
];

const unifiedReviewSchema = z.object({
  condition_id: z.string().min(1, "Select a condition"),
  treatment_plan: z.string().optional(),
  notes: z.string().optional(),
  disposition: z.string().min(1, "Select a disposition"),
  referral_note: z.string().optional(),
  got_treatment: z.boolean().default(false),
  outcome_verified: z.boolean().default(false),
  is_final: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.disposition === "REFERRED_TO_CLINIC") {
      return !!data.referral_note && data.referral_note.trim().length > 0;
    }
    return true;
  },
  {
    message: "Referral note is required when referring to clinic",
    path: ["referral_note"],
  }
);

type UnifiedReviewFormData = z.infer<typeof unifiedReviewSchema>;

interface ClinicalReviewCompleteFormProps {
  consultationId: string;
  canMarkFinal: boolean;
  onSuccess?: () => void;
  /** When true, render only the form content without the Card wrapper (e.g. inside a modal) */
  embedded?: boolean;
}

export function ClinicalReviewCompleteForm({
  consultationId,
  canMarkFinal,
  onSuccess,
  embedded = false,
}: ClinicalReviewCompleteFormProps) {
  const createReview = useCreateReview();
  const updateConsultation = useUpdateConsultation();
  const { data: conditions } = useConditions();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<UnifiedReviewFormData>({
    resolver: zodResolver(unifiedReviewSchema) as never,
    defaultValues: {
      condition_id: "",
      disposition: "",
      got_treatment: false,
      outcome_verified: false,
      is_final: false,
    },
  });

  const conditionId = watch("condition_id");
  const disposition = watch("disposition");

  async function onSubmit(data: UnifiedReviewFormData) {
    const condition = conditions?.find((c) => c.condition_id === data.condition_id);
    const diagnosis = condition?.condition_name ?? "";
    
    if (!diagnosis) {
      setError("condition_id", { message: "Select a condition" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Step 1: Create clinical review
      await createReview.mutateAsync({
        consultation_id: consultationId,
        diagnosis,
        treatment_plan: data.treatment_plan || undefined,
        notes: data.notes || undefined,
        is_final: data.is_final,
      });

      // Step 2: Update consultation with disposition and outcome
      await updateConsultation.mutateAsync({
        id: consultationId,
        data: {
          disposition: data.disposition,
          referral_note:
            data.disposition === "REFERRED_TO_CLINIC"
              ? data.referral_note
              : undefined,
          got_treatment: data.got_treatment,
          outcome_verified: data.outcome_verified,
        },
      });

      toast("Clinical review completed successfully", "success");
      onSuccess?.();
    } catch (err) {
      if (isApiError(err)) {
        toast(err.detail, "error");
      } else {
        toast("Failed to complete clinical review", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Clinical Assessment */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              1. Clinical Assessment
            </h3>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Diagnosis / Condition <span className="text-red-500">*</span>
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
              placeholder="Recommended treatment, medication, follow-up instructions..."
              error={errors.treatment_plan?.message}
              rows={3}
              {...register("treatment_plan")}
            />

            <Textarea
              label="Clinical Notes"
              placeholder="Additional observations, patient history, concerns..."
              error={errors.notes?.message}
              rows={3}
              {...register("notes")}
            />
          </div>

          {/* Section 2: Disposition */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              2. Care Pathway / Disposition <span className="text-red-500">*</span>
            </h3>
            
            <div className="grid gap-3 sm:grid-cols-3">
              {DISPOSITIONS.map((disp) => {
                const Icon = disp.icon;
                const isSelected = disposition === disp.value;
                return (
                  <button
                    key={disp.value}
                    type="button"
                    onClick={() => {
                      setValue("disposition", disp.value);
                      clearErrors("disposition");
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      "hover:border-primary-300 hover:bg-primary-50/50",
                      isSelected
                        ? "border-primary-600 bg-primary-50"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isSelected ? "text-primary-600" : "text-slate-400"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium text-center",
                        isSelected ? "text-primary-900" : "text-slate-700"
                      )}
                    >
                      {disp.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.disposition?.message && (
              <p className="text-sm text-red-600">{errors.disposition.message}</p>
            )}

            {disposition === "REFERRED_TO_CLINIC" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Referral Note <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Reason for referral, recommended facility, specific instructions..."
                  rows={3}
                  error={errors.referral_note?.message}
                  {...register("referral_note")}
                />
                <p className="text-xs text-slate-500">
                  Provide details about why the patient is being referred and any special instructions
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Treatment Outcome */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              3. Treatment Outcome
            </h3>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                {...register("got_treatment")}
              />
              <span className="text-sm text-slate-700">
                Patient received treatment
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                {...register("outcome_verified")}
              />
              <span className="text-sm text-slate-700">
                Outcome verified (follow-up completed)
              </span>
            </label>
          </div>

          {/* Section 4: Finalize */}
          <div className="space-y-4 rounded-lg border border-primary-200 bg-primary-50/30 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              4. Finalize Review
            </h3>
            {canMarkFinal && (
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  {...register("is_final")}
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Mark as Final Review (Specialist Only)
                  </span>
                  <p className="text-xs text-slate-500">
                    This will close the consultation and mark it as complete
                  </p>
                </div>
              </label>
            )}
            
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              Complete Clinical Review
            </Button>
          </div>
        </form>
  );

  if (embedded) return formContent;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">
          Complete Clinical Review
        </h2>
        <p className="text-sm text-slate-600">
          Provide diagnosis, disposition, and treatment outcome in one form
        </p>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
