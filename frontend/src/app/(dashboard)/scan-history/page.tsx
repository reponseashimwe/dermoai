"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ScanHistoryList } from "@/components/scan/scan-history-list";
import { QuickScanModal } from "@/components/scan/quick-scan-modal";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export default function ScanHistoryPage() {
  const [quickScanOpen, setQuickScanOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Scan History"
          description="View your previous quick scan results"
        />
        <Button onClick={() => setQuickScanOpen(true)}>
          <Camera className="h-4 w-4" />
          + Quick Scan
        </Button>
      </div>
      <ScanHistoryList />
      <QuickScanModal
        open={quickScanOpen}
        onClose={() => setQuickScanOpen(false)}
      />
    </div>
  );
}
