"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useUpdateConsultation } from "@/hooks/use-consultations";
import { AlertTriangle, CheckCircle2, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface DispositionOutcomeFormProps {
  consultationId: string;
  currentDisposition?: string | null;
  currentReferralNote?: string | null;
  gotTreatment?: boolean | null;
  outcomeVerified?: boolean | null;
}

const DISPOSITIONS = [
  {
    value: "TREATED_LOCALLY",
    label: "Treated Locally",
    icon: CheckCircle2,
  },
  {
    value: "TELEMEDICINE_ONLY",
    label: "Telemedicine Only",
    icon: Stethoscope,
  },
  {
    value: "REFERRED_TO_CLINIC",
    label: "Referred to Clinic",
    icon: AlertTriangle,
  },
];

export function DispositionOutcomeForm({
  consultationId,
  currentDisposition,
  currentReferralNote,
  gotTreatment,
  outcomeVerified,
}: DispositionOutcomeFormProps) {
  const [disposition, setDisposition] = useState(currentDisposition ?? "");
  const [referralNote, setReferralNote] = useState(currentReferralNote ?? "");
  const [treatment, setTreatment] = useState(gotTreatment ?? false);
  const [verified, setVerified] = useState(outcomeVerified ?? false);

  const { toast } = useToast();
  const updateConsultation = useUpdateConsultation();

  const handleSave = async () => {
    if (disposition === "REFERRED_TO_CLINIC" && !referralNote.trim()) {
      return;
    }
    try {
      await updateConsultation.mutateAsync({
        id: consultationId,
        data: {
          disposition: disposition || undefined,
          referral_note:
            disposition === "REFERRED_TO_CLINIC" ? referralNote : undefined,
          got_treatment: treatment,
          outcome_verified: verified,
        },
      });
      toast("Disposition and outcome saved", "success");
    } catch {
      toast("Failed to save disposition and outcome", "error");
    }
  };

  const hasChanges =
    disposition !== (currentDisposition ?? "") ||
    referralNote !== (currentReferralNote ?? "") ||
    treatment !== (gotTreatment ?? false) ||
    verified !== (outcomeVerified ?? false);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">
          Disposition & Outcome
        </h2>
        <p className="text-sm text-slate-600">
          Track referral decisions and treatment outcomes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Disposition <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {DISPOSITIONS.map((disp) => {
              const Icon = disp.icon;
              const isSelected = disposition === disp.value;
              return (
                <button
                  key={disp.value}
                  type="button"
                  onClick={() => setDisposition(disp.value)}
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
                      "text-sm font-medium",
                      isSelected ? "text-primary-900" : "text-slate-700"
                    )}
                  >
                    {disp.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {disposition === "REFERRED_TO_CLINIC" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Referral Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={referralNote}
              onChange={(e) => setReferralNote(e.target.value)}
              placeholder="Reason for referral, recommended facility, specific instructions..."
              rows={4}
              className="w-full"
            />
            <p className="mt-1 text-xs text-slate-500">
              Provide details about why the patient is being referred and any
              special instructions
            </p>
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Treatment Outcome
          </h3>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={treatment}
              onChange={(e) => setTreatment(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">
              Patient received treatment
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">
              Outcome verified (follow-up completed)
            </span>
          </label>
        </div>

        <Button
          onClick={handleSave}
          disabled={
            !hasChanges ||
            !disposition ||
            updateConsultation.isPending ||
            (disposition === "REFERRED_TO_CLINIC" && !referralNote.trim())
          }
          loading={updateConsultation.isPending}
          className="w-full"
        >
          Save Disposition & Outcome
        </Button>
      </CardContent>
    </Card>
  );
}
