"use client";

import { useState } from "react";
import { useConsultation, useSetConsultationImagesConsent } from "@/hooks/use-consultations";
import { useConsultationImages } from "@/hooks/use-images";
import { usePatient } from "@/hooks/use-patients";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationStatusBadge } from "./consultation-status-badge";
import { AggregatedResultCard } from "@/components/images/aggregated-result-card";
import { ImageGallery } from "@/components/images/image-gallery";
import { ImageUploadZone } from "@/components/images/image-upload-zone";
import { AttachScanModal } from "@/components/images/attach-scan-modal";
import { UrgentConsultationBanner } from "@/components/telemedicine/urgent-consultation-banner";
import { formatDate } from "@/lib/utils";
import { Paperclip, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsultationDetailProps {
  consultationId: string;
  reviewSection?: React.ReactNode;
}

export function ConsultationDetail({
  consultationId,
  reviewSection,
}: ConsultationDetailProps) {
  const { data: consultation, isLoading } = useConsultation(consultationId);
  const { data: patient } = usePatient(consultation?.patient_id || "");
  const { data: images } = useConsultationImages(consultationId);
  const setConsent = useSetConsultationImagesConsent();
  const [attachOpen, setAttachOpen] = useState(false);

  const hasImages = (images?.length ?? 0) > 0;
  const allConsented =
    hasImages && images!.every((img) => img.consent_to_reuse);

  function handleConsentToggle() {
    setConsent.mutate({
      consultationId,
      consentToReuse: !allConsented,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!consultation) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultation</h1>
          <p className="text-sm text-slate-500">
            Created {formatDate(consultation.created_at)}
          </p>
        </div>
        <ConsultationStatusBadge status={consultation.status} />
      </div>

      {consultation.urgency === "URGENT" && (
        <UrgentConsultationBanner consultationId={consultation.consultation_id} />
      )}

      {/* Patient + Result: 2-column on desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        {patient && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100">
                <User className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{patient.name}</p>
                {patient.phone_number && (
                  <p className="text-xs text-slate-500">{patient.phone_number}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <AggregatedResultCard consultation={consultation} />
      </div>

      {/* Images + Clinical Reviews: grid on large screens to use space */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Images</h2>
              <div className="flex gap-2">
                <ImageUploadZone consultationId={consultationId} compact />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttachOpen(true)}
                >
                  <Paperclip className="h-4 w-4" />
                  Attach Scan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 text-sm text-slate-700",
                !hasImages && "cursor-not-allowed opacity-60"
              )}
            >
              <input
                type="checkbox"
                checked={allConsented}
                disabled={!hasImages}
                onChange={handleConsentToggle}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
              />
              <span>
                Allow all images in review queue (specialists can review later)
              </span>
            </label>
            {setConsent.isPending && (
              <p className="text-xs text-slate-500">Updating…</p>
            )}
            <ImageGallery consultationId={consultationId} />
          </CardContent>
        </Card>

        {/* Clinical Reviews */}
        {reviewSection}
      </div>

      <AttachScanModal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        consultationId={consultationId}
      />
    </div>
  );
}
