"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ScanHistoryList } from "@/components/scan/scan-history-list";

export default function ScanHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Scan History"
        description="View your previous quick scan results"
      />
      <ScanHistoryList />
    </div>
  );
}
