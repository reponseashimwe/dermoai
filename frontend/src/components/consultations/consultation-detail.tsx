"use client";

import { useState } from "react";
import { useConsultation } from "@/hooks/use-consultations";
import { usePatient } from "@/hooks/use-patients";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationStatusBadge } from "./consultation-status-badge";
import { AggregatedResultCard } from "@/components/images/aggregated-result-card";
import { ImageGallery } from "@/components/images/image-gallery";
import { ImageUploadZone } from "@/components/images/image-upload-zone";
import { AttachScanModal } from "@/components/images/attach-scan-modal";
import { formatDate } from "@/lib/utils";
import { Paperclip, User } from "lucide-react";

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
  const [attachOpen, setAttachOpen] = useState(false);

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

      {/* Patient Info */}
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

      {/* Aggregated Result */}
      <AggregatedResultCard consultation={consultation} />

      {/* Images */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Images</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttachOpen(true)}
            >
              <Paperclip className="h-4 w-4" />
              Attach Scan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploadZone consultationId={consultationId} />
          <ImageGallery consultationId={consultationId} />
        </CardContent>
      </Card>

      {/* Clinical Reviews */}
      {reviewSection}

      <AttachScanModal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        consultationId={consultationId}
      />
    </div>
  );
}
