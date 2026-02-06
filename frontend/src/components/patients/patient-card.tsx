import { Card, CardContent } from "@/components/ui/card";
import { User, Phone, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types/api";

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  return (
    <Card
      className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
          <User className="h-5 w-5 text-primary-700" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-900">{patient.name}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {patient.phone_number && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {patient.phone_number}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(patient.created_at)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
