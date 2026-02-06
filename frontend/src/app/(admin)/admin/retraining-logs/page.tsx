"use client";

import { PageHeader } from "@/components/layout/page-header";
import { RetrainingLogTable } from "@/components/admin/retraining-log-table";
import { RetrainingLogForm } from "@/components/admin/retraining-log-form";

export default function RetrainingLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Retraining Logs"
        description="Model retraining history and new log entries"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <RetrainingLogTable />
        <RetrainingLogForm />
      </div>
    </div>
  );
}
