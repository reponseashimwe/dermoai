import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ConsultationStatusBadge } from "./consultation-status-badge";
import { UrgencyBadge } from "@/components/scan/urgency-badge";
import { formatConditionName, formatConfidence, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import type { Consultation } from "@/types/api";

interface ConsultationCardProps {
  consultation: Consultation;
}

export function ConsultationCard({ consultation }: ConsultationCardProps) {
  const isUrgent = consultation.urgency === "URGENT";
  return (
    <Link href={`/consultations/${consultation.consultation_id}`}>
      <Card
        className={`cursor-pointer transition-shadow hover:shadow-md min-w-0 ${
          isUrgent ? "border-l-4 border-l-red-500" : ""
        }`}
      >
        <CardContent className="flex items-center gap-3 py-3 sm:gap-4 sm:py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 sm:h-10 sm:w-10">
            <FileText className="h-4 w-4 text-slate-600 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900 truncate">
                {consultation.final_predicted_condition
                  ? formatConditionName(consultation.final_predicted_condition)
                  : "Pending Analysis"}
              </p>
              <ConsultationStatusBadge status={consultation.status} />
              {consultation.urgency && (
                <UrgencyBadge
                  urgency={consultation.urgency as "URGENT" | "NON_URGENT"}
                  size="sm"
                  className="shrink-0"
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
              {consultation.final_confidence !== null && (
                <span>
                  Confidence: {formatConfidence(consultation.final_confidence)}
                </span>
              )}
              <span>{formatDate(consultation.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
