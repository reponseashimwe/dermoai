"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConsultation } from "@/hooks/use-consultations";
import { useConsultationImages } from "@/hooks/use-images";
import { usePatient } from "@/hooks/use-patients";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { useAppointmentsByConsultation, useStartCallFromAppointment, useDeleteAppointmentRequest } from "@/hooks/use-appointments";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationStatusBadge } from "./consultation-status-badge";
import { ConsentPinModal } from "./consent-pin-modal";
import { AggregatedResultCard } from "@/components/images/aggregated-result-card";
import { ImageGallery } from "@/components/images/image-gallery";
import { ImageUploadZone } from "@/components/images/image-upload-zone";
import { AttachScanModal } from "@/components/images/attach-scan-modal";
import { UrgentConsultationBanner } from "@/components/telemedicine/urgent-consultation-banner";
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { Paperclip, User, ArrowLeft, ShieldCheck, ShieldX, Calendar, Clock, Video, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsultationDetailProps {
  consultationId: string;
  /** Receives hasImages so review/book actions can be disabled when no images */
  reviewSection?: (hasImages: boolean) => React.ReactNode;
}

export function ConsultationDetail({
  consultationId,
  reviewSection,
}: ConsultationDetailProps) {
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();
  const { data: consultation, isLoading } = useConsultation(consultationId);
  const { data: patient } = usePatient(consultation?.patient_id || "");
  const { data: images, refetch: refetchImages } = useConsultationImages(consultationId);
  const router = useRouter();
  const { toast } = useToast();
  const { data: appointments, refetch: refetchAppointments } = useAppointmentsByConsultation(consultationId);
  const startCall = useStartCallFromAppointment();
  const deleteAppointment = useDeleteAppointmentRequest();
  const [attachOpen, setAttachOpen] = useState(false);
  const [consentPinOpen, setConsentPinOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  async function handleAppointmentCall(requestId: string) {
    try {
      const data = await startCall.mutateAsync(requestId);
      router.push(`/teleconsultations/${data.teleconsultation_id}`);
    } catch {
      toast("Could not start call. Try the Call page if no specialist is assigned.", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    try {
      await deleteAppointment.mutateAsync(deleteTargetId);
      toast("Appointment deleted", "success");
      setDeleteTargetId(null);
    } catch {
      toast("Could not delete appointment", "error");
    }
  }

  const isPractitioner = user?.role === "PRACTITIONER";
  const currentPractitioner = practitioners?.find((p) => p.user_id === user?.user_id);
  const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";
  /** For appointment cards: show the other party (never the current user). Specialist sees requester; patient/GP sees specialist. */
  const getAppointmentOtherParty = (apt: { specialist_name?: string | null; requester_name?: string | null }) =>
    isSpecialist ? apt.requester_name : apt.specialist_name;

  /** Latest appointment that is not rejected and not done (PENDING, APPROVED, RESCHEDULED); prefer next upcoming by date. */
  const latestActiveAppointment = (() => {
    const active = (appointments ?? []).filter(
      (a) => a.status !== "REJECTED"
    );
    if (active.length === 0) return null;
    const sorted = [...active].sort(
      (a, b) =>
        new Date(b.proposed_datetime).getTime() -
        new Date(a.proposed_datetime).getTime()
    );
    return sorted[0];
  })();

  const hasImages = (images?.length ?? 0) > 0;
  const allConsented =
    hasImages && images!.every((img) => img.consent_to_reuse);

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
      <Link
        href="/consultations"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to consultations
      </Link>

      {/* Header: left = title + created + status; right = appointment when present */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultation</h1>
          <p className="text-sm text-slate-500">
            Created {formatDate(consultation.created_at)}
          </p>
          <div className="mt-2">
            <ConsultationStatusBadge status={consultation.status} />
          </div>
        </div>
        {latestActiveAppointment && (
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium",
                latestActiveAppointment.status === "APPROVED" &&
                  "bg-green-100 text-green-800 border border-green-200",
                latestActiveAppointment.status === "PENDING" &&
                  "bg-amber-100 text-amber-800 border border-amber-200",
                latestActiveAppointment.status === "RESCHEDULED" &&
                  "bg-blue-100 text-blue-800 border border-blue-200"
              )}
            >
              {formatDate(
                latestActiveAppointment.status === "RESCHEDULED" &&
                  latestActiveAppointment.specialist_proposed_datetime
                  ? latestActiveAppointment.specialist_proposed_datetime
                  : latestActiveAppointment.proposed_datetime
              )}
            </span>
            {latestActiveAppointment.status === "APPROVED" && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 shrink-0 p-0"
                onClick={() => handleAppointmentCall(latestActiveAppointment.request_id)}
                loading={startCall.isPending}
                title="Video call"
              >
                <Video className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
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
            {/* Consent Status and Action */}
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  {allConsented ? (
                    <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldX className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {allConsented ? "Consent Granted" : "Consent Required"}
                    </p>
                    <p className="text-xs text-slate-600">
                      {allConsented
                        ? "Images available for specialist review"
                        : "Images not yet available for review queue"}
                    </p>
                  </div>
                </div>
              </div>
              
              {user?.role === "PRACTITIONER" && hasImages && (
                <Button
                  onClick={() => setConsentPinOpen(true)}
                  size="sm"
                  variant={allConsented ? "outline" : "primary"}
                  className="w-full"
                >
                  {allConsented ? "Update Consent" : "Request Consent via SMS"}
                </Button>
              )}
            </div>

            <ImageGallery consultationId={consultationId} />
          </CardContent>
        </Card>

        {/* Clinical Reviews */}
        {reviewSection?.(hasImages)}
      </div>

      {/* Appointments Section — visible to all; practitioners can request when hasImages */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Appointments</h2>
            {isPractitioner ? (
              hasImages ? (
                <Button
                  size="sm"
                  onClick={() => setAppointmentModalOpen(true)}
                >
                  <Calendar className="h-4 w-4" />
                  Book appointment
                </Button>
              ) : (
                <span className="text-sm text-slate-500">
                  Add images to this consultation to book an appointment.
                </span>
              )
            ) : (
              <Link href="/schedules" className="text-sm font-medium text-primary-600 hover:underline">
                View Schedules
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!appointments || appointments.length === 0 ? (
            <div className="py-6 text-center">
              <Calendar className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No appointment requests yet</p>
              {isPractitioner ? (
                hasImages ? (
                  <p className="text-xs text-slate-400">Book an appointment with a specialist above</p>
                ) : (
                  <p className="text-xs text-slate-400">Add images to this consultation to book an appointment.</p>
                )
              ) : (
                <p className="text-xs text-slate-400">When your practitioner books one, it will appear here and in Schedules</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.request_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(apt.proposed_datetime)}
                      </p>
                      {getAppointmentOtherParty(apt) && (
                        <p className="text-xs text-slate-600">
                          {isSpecialist ? "Requested by: " : "With: "}
                          {getAppointmentOtherParty(apt)}
                        </p>
                      )}
                      {apt.notes && (
                        <p className="text-xs text-slate-500">{apt.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          apt.status === "APPROVED" && "bg-green-100 text-green-800",
                          apt.status === "PENDING" && "bg-amber-100 text-amber-800",
                          apt.status === "REJECTED" && "bg-red-100 text-red-800",
                          apt.status === "RESCHEDULED" && "bg-blue-100 text-blue-800"
                        )}
                      >
                        {apt.status}
                      </span>
                      {user?.user_id === apt.requested_by_user_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleteTargetId(apt.request_id)}
                          title="Delete appointment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 shrink-0 p-0 ml-auto"
                      onClick={() => handleAppointmentCall(apt.request_id)}
                      loading={startCall.isPending}
                      title="Video call"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {isPractitioner ? (
                <Link
                  href="/appointments"
                  className="block text-center text-sm font-medium text-primary-600 hover:underline"
                >
                  View all appointments
                </Link>
              ) : (
                <Link
                  href="/schedules"
                  className="block text-center text-sm font-medium text-primary-600 hover:underline"
                >
                  View Schedules
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AttachScanModal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        consultationId={consultationId}
      />

      <ConsentPinModal
        open={consentPinOpen}
        onClose={() => setConsentPinOpen(false)}
        consultationId={consultationId}
        onSuccess={() => {
          refetchImages();
        }}
      />

      <CreateAppointmentModal
        open={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        consultationId={consultationId}
        onSuccess={() => {
          refetchAppointments();
        }}
      />

      <ConfirmDialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        title="Delete appointment"
        description="This appointment will be removed. You can create a new one from this consultation if needed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        loading={deleteAppointment.isPending}
      />
    </div>
  );
}
