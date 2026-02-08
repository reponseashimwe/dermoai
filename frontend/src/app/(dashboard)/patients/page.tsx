"use client";

import { useState } from "react";
import { usePatients, useCreatePatient } from "@/hooks/use-patients";
import { PageHeader } from "@/components/layout/page-header";
import { PatientCard } from "@/components/patients/patient-card";
import { PatientForm } from "@/components/patients/patient-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PatientsPage() {
  const { data: patients, isLoading } = usePatients();
  const createPatient = useCreatePatient();
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Manage your patients"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !patients?.length && (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No patients yet"
          description="Add a patient to begin creating consultations."
          action={{
            label: "Add Patient",
            onClick: () => setShowCreate(true),
          }}
        />
      )}

      {patients && patients.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => (
            <PatientCard
              key={p.patient_id}
              patient={p}
              onClick={() => router.push(`/patients/${p.patient_id}`)}
            />
          ))}
          <Card
            className="flex cursor-pointer flex-col items-center justify-center border-dashed py-8 transition-shadow hover:shadow-md"
            onClick={() => setShowCreate(true)}
          >
            <CardContent className="flex flex-col items-center gap-2">
              <Plus className="h-8 w-8 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                Add Patient
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Patient"
      >
        <PatientForm
          submitLabel="Create Patient"
          onSubmit={async (data) => {
            await createPatient.mutateAsync(data);
            toast("Patient created", "success");
            setShowCreate(false);
          }}
        />
      </Modal>
    </div>
  );
}
