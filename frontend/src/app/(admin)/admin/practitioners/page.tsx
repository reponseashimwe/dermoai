"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PendingPractitionerList } from "@/components/practitioners/pending-practitioner-list";

export default function PractitionerApprovalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Practitioner Approvals"
        description="Review and approve pending practitioner registrations"
      />
      <PendingPractitionerList />
    </div>
  );
}
