import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Phone, Calendar, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types/api";

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const content = (
    <Card
      className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Avatar name={patient.name} className="h-14 w-14 text-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 truncate">{patient.name}</p>
            {patient.phone_number && (
              <p className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {patient.phone_number}
              </p>
            )}
            <p className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
              <Calendar className="h-3 w-3 shrink-0" />
              Added {formatDate(patient.created_at)}
            </p>
          </div>
          {onClick && (
            <div className="shrink-0 flex items-center">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <ChevronRight className="h-5 w-5" />
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
        {content}
      </div>
    );
  }
  return content;
}
