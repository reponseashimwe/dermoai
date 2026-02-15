"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PatientSelect } from "@/components/patients/patient-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { useCreateConsultation } from "@/hooks/use-consultations";
import { useMyPatient, useCreatePatient } from "@/hooks/use-patients";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import { Spinner } from "@/components/ui/spinner";
import type { Patient } from "@/types/api";

export function ConsultationCreateForm() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { user } = useAuth();
  const isPatient = user?.role === "USER";
  const { data: myPatient, isLoading: myPatientLoading, error: myPatientError } = useMyPatient(isPatient);
  const createPatient = useCreatePatient();
  const createConsultation = useCreateConsultation();
  const router = useRouter();
  const { toast } = useToast();

  async function handleCreateForSelf() {
    const patient = myPatient ?? selectedPatient;
    if (!patient) return;
    try {
      const consultation = await createConsultation.mutateAsync({
        patient_id: patient.patient_id,
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

  async function handleCreateConsultationWithProfile() {
    if (!user) return;
    try {
      const patient = await createPatient.mutateAsync({
        name: user.name,
        phone_number: user.phone_number ?? undefined,
        user_id: user.user_id,
      });
      const consultation = await createConsultation.mutateAsync({
        patient_id: patient.patient_id,
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

  if (isPatient) {
    if (myPatientLoading) {
      return (
        <Card>
          <CardContent className="flex justify-center py-8">
            <Spinner />
          </CardContent>
        </Card>
      );
    }
    if (isPatient && myPatientError && !myPatient) {
      return (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">New consultation</h2>
            <p className="text-sm text-slate-500">
              We'll use your account details for this consultation.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="font-medium text-slate-700">{user?.name}</p>
              <p className="text-slate-500">{user?.email}</p>
              {user?.phone_number && (
                <p className="text-slate-500">{user.phone_number}</p>
              )}
            </div>
            <Button
              onClick={handleCreateConsultationWithProfile}
              loading={createPatient.isPending || createConsultation.isPending}
              className="w-full"
            >
              Create consultation
            </Button>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">New consultation</h2>
          <p className="text-sm text-slate-500">
            Create a consultation for yourself.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {myPatient && (
            <Alert variant="info">
              Consultation for <strong>{myPatient.name}</strong>
            </Alert>
          )}
          <Button
            onClick={handleCreateForSelf}
            disabled={!myPatient}
            loading={createConsultation.isPending}
            className="w-full"
          >
            Create consultation
          </Button>
        </CardContent>
      </Card>
    );
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
          onClick={() => handleCreateForSelf()}
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
