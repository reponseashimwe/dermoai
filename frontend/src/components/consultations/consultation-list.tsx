"use client";

import { useConsultations } from "@/hooks/use-consultations";
import { ConsultationCard } from "./consultation-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function ConsultationList() {
  const { data: consultations, isLoading } = useConsultations();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!consultations?.length) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="No consultations yet"
        description="Create a consultation to get started with a formal skin assessment."
        action={{
          label: "New Consultation",
          onClick: () => router.push("/consultations/new"),
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {consultations.map((c) => (
        <ConsultationCard key={c.consultation_id} consultation={c} />
      ))}
    </div>
  );
}
