"use client";

import {
  usePendingPractitioners,
  useApprovePractitioner,
} from "@/hooks/use-practitioners";
import { PractitionerCard } from "./practitioner-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, XCircle, UserCheck } from "lucide-react";

interface PendingPractitionerListProps {
  limit?: number;
}

export function PendingPractitionerList({ limit }: PendingPractitionerListProps = {}) {
  const { data: pending, isLoading } = usePendingPractitioners();
  const approve = useApprovePractitioner();
  const { toast } = useToast();
  const list = limit != null && pending ? pending.slice(0, limit) : pending ?? [];

  async function handleAction(
    practitionerId: string,
    status: "APPROVED" | "REJECTED"
  ) {
    try {
      await approve.mutateAsync({
        practitionerId,
        action: { approval_status: status },
      });
      toast(
        `Practitioner ${status.toLowerCase()}`,
        status === "APPROVED" ? "success" : "info"
      );
    } catch {
      toast("Failed to update status", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!list.length) {
    return (
      <EmptyState
        icon={<UserCheck className="h-10 w-10" />}
        title="No pending approvals"
        description="All practitioner registrations have been reviewed."
      />
    );
  }

  return (
    <div className="space-y-3">
      {list.map((p) => (
        <PractitionerCard
          key={p.practitioner_id}
          practitioner={p}
          actions={
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction(p.practitioner_id, "APPROVED")}
                loading={approve.isPending}
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction(p.practitioner_id, "REJECTED")}
                loading={approve.isPending}
              >
                <XCircle className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          }
        />
      ))}
    </div>
  );
}
