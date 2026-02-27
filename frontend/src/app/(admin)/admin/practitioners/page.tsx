"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PendingPractitionerList } from "@/components/practitioners/pending-practitioner-list";
import { PractitionerCard } from "@/components/practitioners/practitioner-card";
import { usePractitioners, usePendingPractitioners } from "@/hooks/use-practitioners";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { UserCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "pending" | "active";

export default function PractitionerApprovalsPage() {
  const [tab, setTab] = useState<TabId>("pending");
  const { data: allPractitioners, isLoading: loadingAll } = usePractitioners();
  const { data: pending, isLoading: loadingPending } = usePendingPractitioners();

  const activeList = allPractitioners?.filter((p) => p.approval_status === "APPROVED") ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Practitioner Approvals"
        description="Review and approve pending practitioner registrations"
      />

      {/* Tabs — mobile friendly */}
      <div className="rounded-t-xl border border-b-0 border-slate-200 bg-white px-1 pt-1">
        <div className="flex gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:py-2.5",
              tab === "pending"
                ? "bg-primary-100 text-primary-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            Pending {pending != null && pending.length > 0 && `(${pending.length})`}
          </button>
          <button
            type="button"
            onClick={() => setTab("active")}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:py-2.5",
              tab === "active"
                ? "bg-primary-100 text-primary-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            Active {activeList.length > 0 && `(${activeList.length})`}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="rounded-b-xl border border-slate-200 border-t-0 bg-white p-4 sm:p-5">
        {tab === "pending" && (
          <>
            {loadingPending ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full sm:h-14" />
                ))}
              </div>
            ) : (
              <PendingPractitionerList />
            )}
          </>
        )}
        {tab === "active" && (
          <>
            {loadingAll ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full sm:h-14" />
                ))}
              </div>
            ) : activeList.length === 0 ? (
              <EmptyState
                icon={<Users className="h-10 w-10" />}
                title="No active practitioners"
                description="Approved practitioners will appear here."
              />
            ) : (
              <div className="space-y-2">
                {activeList.map((p) => (
                  <PractitionerCard key={p.practitioner_id} practitioner={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
