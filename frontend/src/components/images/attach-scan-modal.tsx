"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useScanHistory } from "@/hooks/use-scan-history";
import { useAttachImage } from "@/hooks/use-images";
import { useToast } from "@/components/ui/toast";
import { formatConditionName, formatConfidence, formatDate } from "@/lib/utils";
import { Camera, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AttachScanModalProps {
  open: boolean;
  onClose: () => void;
  consultationId: string;
}

export function AttachScanModal({
  open,
  onClose,
  consultationId,
}: AttachScanModalProps) {
  const { data: scans, isLoading } = useScanHistory();
  const attach = useAttachImage();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);

  async function handleAttach() {
    if (!selected) return;
    try {
      await attach.mutateAsync({ imageId: selected, consultationId });
      toast("Scan attached to consultation", "success");
      onClose();
    } catch {
      toast("Failed to attach scan", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Attach Quick Scan">
      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!isLoading && !scans?.length && (
        <EmptyState
          icon={<Camera className="h-10 w-10" />}
          title="No scans available"
          description="Run a quick scan first to have images to attach."
        />
      )}

      {scans && scans.length > 0 && (
        <div className="space-y-4">
          <div className="max-h-64 space-y-2 overflow-auto">
            {scans
              .filter((s) => !s.consultation_id)
              .map((scan) => (
                <button
                  key={scan.image_id}
                  onClick={() => setSelected(scan.image_id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected === scan.image_id
                      ? "border-primary-500 bg-primary-50"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <img
                    src={scan.image_url}
                    alt="Scan"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {scan.predicted_condition
                        ? formatConditionName(scan.predicted_condition)
                        : "Pending"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {scan.confidence !== null && formatConfidence(scan.confidence)}
                      {" - "}
                      {formatDate(scan.uploaded_at)}
                    </p>
                  </div>
                  {selected === scan.image_id && (
                    <Check className="h-5 w-5 text-primary-600" />
                  )}
                </button>
              ))}
          </div>
          <Button
            onClick={handleAttach}
            disabled={!selected}
            loading={attach.isPending}
            className="w-full"
          >
            Attach Selected Scan
          </Button>
        </div>
      )}
    </Modal>
  );
}
