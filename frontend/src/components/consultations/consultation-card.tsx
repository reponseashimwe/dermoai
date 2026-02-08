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
        className={`cursor-pointer transition-shadow hover:shadow-md ${
          isUrgent ? "border-l-4 border-l-red-500" : ""
        }`}
      >
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <FileText className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">
                {consultation.final_predicted_condition
                  ? formatConditionName(consultation.final_predicted_condition)
                  : "Pending Analysis"}
              </p>
              <ConsultationStatusBadge status={consultation.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {consultation.final_confidence !== null && (
                <span>
                  Confidence: {formatConfidence(consultation.final_confidence)}
                </span>
              )}
              <span>{formatDate(consultation.created_at)}</span>
            </div>
          </div>
          {consultation.urgency && (
            <UrgencyBadge
              urgency={consultation.urgency as "URGENT" | "NON_URGENT"}
              size="sm"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
