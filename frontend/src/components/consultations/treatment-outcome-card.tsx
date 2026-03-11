"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Consultation } from "@/types/api";
import { useUpdateConsultation } from "@/hooks/use-consultations";
import { useToast } from "@/components/ui/toast";

const dispositionConfig = {
  TREATED_LOCALLY: {
    label: "Treated Locally",
    icon: CheckCircle2,
    color: "text-green-700 bg-green-50 border-green-200",
  },
  TELEMEDICINE_ONLY: {
    label: "Telemedicine Only",
    icon: Stethoscope,
    color: "text-blue-700 bg-blue-50 border-blue-200",
  },
  REFERRED_TO_CLINIC: {
    label: "Referred to Clinic",
    icon: AlertTriangle,
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
};

interface TreatmentOutcomeCardProps {
  consultation: Consultation | null | undefined;
}

export function TreatmentOutcomeCard({ consultation }: TreatmentOutcomeCardProps) {
  const { toast } = useToast();
  const updateConsultation = useUpdateConsultation();

  const canQuickUpdate = !!consultation && consultation.status !== "CLOSED";

  const toggleField = (field: "got_treatment" | "outcome_verified") => {
    if (!consultation || !canQuickUpdate) return;
    const current = consultation[field];
    const next = !current;
    updateConsultation.mutate(
      {
        id: consultation.consultation_id,
        data: { [field]: next } as any,
      },
      {
        onError: () => {
          toast("Could not update treatment outcome", "error");
        },
      }
    );
  };

  if (
    !consultation?.disposition &&
    consultation?.got_treatment == null &&
    consultation?.outcome_verified == null
  ) {
    return (
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Treatment & Outcome</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No disposition or outcome recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const disposition = consultation.disposition
    ? dispositionConfig[consultation.disposition as keyof typeof dispositionConfig]
    : null;

  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader className="pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Treatment & Outcome</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {disposition && (
          <div className={cn("flex items-center gap-2 rounded-lg border p-3", disposition.color)}>
            <disposition.icon className="h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{disposition.label}</p>
              {consultation.referral_note && (
                <p className="text-xs mt-1 opacity-90">{consultation.referral_note}</p>
              )}
            </div>
          </div>
        )}
        <div className="grid gap-2 grid-cols-2">
          {consultation.got_treatment != null && (
            <button
              type="button"
              disabled={!canQuickUpdate || updateConsultation.isPending}
              onClick={() => toggleField("got_treatment")}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-60",
                consultation.got_treatment
                  ? "bg-slate-50 border-slate-200 text-slate-700"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              )}
            >
              {consultation.got_treatment ? <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-600" /> : <XCircle className="h-4 w-4 shrink-0" />}
              <span className="text-xs font-medium">{consultation.got_treatment ? "Treatment received" : "No treatment yet"}</span>
            </button>
          )}
          {consultation.outcome_verified != null && (
            <button
              type="button"
              disabled={!canQuickUpdate || updateConsultation.isPending}
              onClick={() => toggleField("outcome_verified")}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-60",
                consultation.outcome_verified
                  ? "bg-slate-50 border-slate-200 text-slate-700"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              )}
            >
              {consultation.outcome_verified ? <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-600" /> : <XCircle className="h-4 w-4 shrink-0" />}
              <span className="text-xs font-medium">{consultation.outcome_verified ? "Outcome verified" : "Outcome pending"}</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
