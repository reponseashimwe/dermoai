"use client";

import { useRetrainingLogs } from "@/hooks/use-retraining-logs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { Brain } from "lucide-react";

export function RetrainingLogTable() {
  const { data: logs, isLoading } = useRetrainingLogs();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!logs?.length) {
    return (
      <EmptyState
        icon={<Brain className="h-10 w-10" />}
        title="No retraining logs"
        description="Model retraining history will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Date
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Model Version
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Dataset Size
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Accuracy
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {logs.map((log) => (
            <tr key={log.log_id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-900">
                {formatDate(log.retrained_at)}
              </td>
              <td className="px-4 py-3 font-mono text-sm text-slate-600">
                {log.model_version}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {log.dataset_size.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {log.accuracy !== null ? `${(log.accuracy * 100).toFixed(1)}%` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
