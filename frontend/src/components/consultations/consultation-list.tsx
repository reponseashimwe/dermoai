"use client";

import { useSearchParams } from "next/navigation";
import { useConsultations } from "@/hooks/use-consultations";
import { ConsultationCard } from "./consultation-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function ConsultationList() {
  const searchParams = useSearchParams();
  const filterRefer = searchParams.get("filter") === "refer";
  const { data: consultations, isLoading } = useConsultations();
  const router = useRouter();

  const list = filterRefer
    ? (consultations?.filter((c) => c.urgency === "REFER") ?? [])
    : (consultations ?? []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!list.length) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title={filterRefer ? "No referrals" : "No consultations yet"}
        description={
          filterRefer
            ? "Consultations with REFER urgency will appear here."
            : "Create a consultation to get started with a formal skin assessment."
        }
        action={
          filterRefer
            ? undefined
            : {
                label: "New Consultation",
                onClick: () => router.push("/consultations/new"),
              }
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {list.map((c) => (
        <ConsultationCard key={c.consultation_id} consultation={c} />
      ))}
    </div>
  );
}
