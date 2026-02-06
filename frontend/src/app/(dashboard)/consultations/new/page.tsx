"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ConsultationCreateForm } from "@/components/consultations/consultation-create-form";

export default function NewConsultationPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="New Consultation"
        description="Create a new consultation for a patient"
      />
      <ConsultationCreateForm />
    </div>
  );
}
