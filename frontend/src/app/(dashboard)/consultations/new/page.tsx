"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ConsultationCreateForm } from "@/components/consultations/consultation-create-form";
import { useAuth } from "@/hooks/use-auth";

export default function NewConsultationPage() {
  const { user } = useAuth();
  const isPatient = user?.role === "USER";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="New Consultation"
        description={
          isPatient
            ? "Create a consultation for yourself"
            : "Create a new consultation for a patient"
        }
      />
      <ConsultationCreateForm />
    </div>
  );
}
