"use client";

import { use } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ConsultationCreateForm } from "@/components/consultations/consultation-create-form";
import { useAuth } from "@/hooks/use-auth";

export default function NewConsultationPage({ searchParams }: { searchParams: Promise<{ scanId?: string }> }) {
  const { scanId } = use(searchParams);
  const { user } = useAuth();
  const isPatient = user?.role === "USER";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="New Consultation"
        description={
          isPatient
            ? "Create a consultation for yourself"
            : "Select a patient or create one, then start the consultation."
        }
      />
      <ConsultationCreateForm scanId={scanId} />
    </div>
  );
}
