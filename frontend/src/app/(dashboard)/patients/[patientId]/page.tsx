"use client";

import { use } from "react";
import { usePatient } from "@/hooks/use-patients";
import { useConsultations } from "@/hooks/use-consultations";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Phone, Calendar, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const { data: patient, isLoading } = usePatient(patientId);
  const { data: allConsultations } = useConsultations();

  const patientConsultations = allConsultations?.filter(
    (c) => c.patient_id === patientId
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="space-y-6">
      <PageHeader title={patient.name} description="Patient details" />

      <Card>
        <CardContent className="space-y-3 pt-6">
          {patient.phone_number && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="h-4 w-4" />
              {patient.phone_number}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            Registered {formatDate(patient.created_at)}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Consultations
        </h2>
        {!patientConsultations?.length ? (
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title="No consultations"
            description="This patient has no consultations yet."
          />
        ) : (
          <div className="space-y-3">
            {patientConsultations.map((c) => (
              <ConsultationCard key={c.consultation_id} consultation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
