"use client";

import { useState } from "react";
import { useScanHistory } from "@/hooks/use-scan-history";
import { useUpdateImageConsent } from "@/hooks/use-images";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickScanModal } from "@/components/scan/quick-scan-modal";
import { ImageDetailModal } from "@/components/images/image-detail-modal";
import { ConfidenceCircle } from "@/components/scan/confidence-circle";
import { formatConditionName, formatConfidence, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Camera, ExternalLink, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScanHistoryList() {
  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const { data: scans, isLoading } = useScanHistory();
  const updateConsent = useUpdateImageConsent();

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!scans?.length) {
    return (
      <>
        <EmptyState
          icon={<Camera className="h-12 w-12" />}
          title="No scans yet"
          description="Your quick scan history will appear here after you analyze an image."
          action={{
            label: "Do a quick scan",
            onClick: () => setQuickScanOpen(true),
          }}
        />
        <QuickScanModal
          open={quickScanOpen}
          onClose={() => setQuickScanOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1">
        {scans.map((scan) => {
          const confidence = scan.confidence ?? 0;
          const urgency = confidence < 0.45 ? "REFER" : "MANAGE LOCALLY";
          return (
            <Card
              key={scan.image_id}
              className="cursor-pointer transition-colors hover:bg-slate-50 hover:shadow-md"
              onClick={() => setSelectedImageId(scan.image_id)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={scan.image_url}
                    alt="Scan"
                    className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 truncate">
                        {scan.predicted_condition
                          ? formatConditionName(scan.predicted_condition)
                          : "Pending"}
                      </p>
                      {scan.reviewed_label && (
                        <Badge variant="default" className="shrink-0 text-xs">
                          Reviewed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(scan.uploaded_at)}
                    </p>
                    <label
                      className={cn(
                        "mt-3 flex items-center gap-2 text-xs cursor-pointer w-fit",
                        "focus-within:outline-none"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={scan.consent_to_reuse}
                        onChange={(e) => {
                          updateConsent.mutate({
                            imageId: scan.image_id,
                            consent: e.target.checked,
                          });
                        }}
                        className="sr-only"
                      />
                      <span
                        role="switch"
                        aria-checked={scan.consent_to_reuse}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
                          scan.consent_to_reuse ? "bg-primary-500" : "bg-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition translate-y-0.5",
                            scan.consent_to_reuse ? "translate-x-4" : "translate-x-0.5"
                          )}
                        />
                      </span>
                      <span className="text-slate-600">Consent for reuse in model improvement</span>
                    </label>
                    <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {scan.consultation_id ? (
                        <Link
                          href={`/consultations/${scan.consultation_id}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Consultation
                        </Link>
                      ) : (
                        <Link
                          href={`/consultations/new?scanId=${scan.image_id}`}
                          className="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="h-3 w-3" />
                          Create Consultation
                        </Link>
                      )}
                    </div>
                  </div>
                  {scan.confidence !== null && (
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <ConfidenceCircle
                        value={confidence}
                        urgency={urgency}
                        size={56}
                        strokeWidth={6}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ImageDetailModal
        imageId={selectedImageId}
        open={selectedImageId !== null}
        onClose={() => setSelectedImageId(null)}
      />
    </>
  );
}
