"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PatientSelect } from "@/components/patients/patient-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { useCreateConsultation } from "@/hooks/use-consultations";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import type { Patient } from "@/types/api";

export function ConsultationCreateForm() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const createConsultation = useCreateConsultation();
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreate() {
    if (!selectedPatient) return;
    try {
      const consultation = await createConsultation.mutateAsync({
        patient_id: selectedPatient.patient_id,
      });
      toast("Consultation created successfully", "success");
      router.push(`/consultations/${consultation.consultation_id}`);
    } catch (err) {
      if (isApiError(err)) {
        toast(err.detail, "error");
      } else {
        toast("Failed to create consultation", "error");
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">
          Select or Create Patient
        </h2>
        <p className="text-sm text-slate-500">
          Choose an existing patient or create a new one for this consultation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <PatientSelect
          onSelect={setSelectedPatient}
          selectedId={selectedPatient?.patient_id}
        />

        {selectedPatient && (
          <Alert variant="info">
            Creating consultation for <strong>{selectedPatient.name}</strong>
          </Alert>
        )}

        <Button
          onClick={handleCreate}
          disabled={!selectedPatient}
          loading={createConsultation.isPending}
          className="w-full"
        >
          Create Consultation
        </Button>
      </CardContent>
    </Card>
  );
}
