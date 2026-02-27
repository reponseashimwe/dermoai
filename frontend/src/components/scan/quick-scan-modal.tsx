"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ScanUploadForm } from "./scan-upload-form";
import { useSaveQuickScanToConsultation } from "@/hooks/use-save-quick-scan-to-consultation";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";

interface QuickScanModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal for quick scan: upload image and see AI analysis result without leaving the page.
 * When result is URGENT, "Save to my consultations" creates a consultation and attaches the scan.
 */
export function QuickScanModal({ open, onClose }: QuickScanModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const saveToConsultation = useSaveQuickScanToConsultation();

  const handleSaveToConsultations = async (result: { image_id: string }) => {
    const consultation = await saveToConsultation.mutateAsync({
      imageId: result.image_id,
    });
    return consultation;
  };

  const handleSaveSuccess = (consultationId: string) => {
    onClose();
    router.push(`/consultations/${consultationId}`);
    toast("Consultation created. Your scan has been saved.", "success");
  };

  const handleSaveError = (error: unknown) => {
    toast(
      isApiError(error) ? error.detail : "Failed to save to consultations. Please try again.",
      "error"
    );
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Quick Scan" className="max-w-lg">
      <p className="mb-4 text-sm text-slate-500">
        Upload a skin image for instant AI analysis. Results stay in this dialog.
      </p>
      <ScanUploadForm
        onSaveToConsultations={handleSaveToConsultations}
        onSaveSuccess={handleSaveSuccess}
        onSaveError={handleSaveError}
        isSaving={saveToConsultation.isPending}
      />
    </Modal>
  );
}
