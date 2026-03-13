"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import {
  useAppointmentsForMyConsultations,
  useApproveAppointment,
  useRejectAppointment,
  useProposeAlternativeTime,
  useStartCallFromAppointment,
  useDeleteAppointmentRequest,
  type AppointmentRequest,
} from "@/hooks/use-appointments";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal";
import { Calendar, Clock, CheckCircle2, XCircle, CalendarClock, User, Phone } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  RESCHEDULED: { label: "Rescheduled", color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-800" },
};

function AppointmentStatusBadge({ status }: { status: AppointmentRequest["status"] }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();
  const { data: appointments, isLoading } = useAppointmentsForMyConsultations();
  const currentPractitioner = practitioners?.find((p) => p.user_id === user?.user_id);
  const practitionerId = currentPractitioner?.practitioner_id;
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description={
          "Manage appointment requests linked to your consultations"
        }
        action={undefined}
      />

      <SpecialistView
        requests={appointments ?? []}
        isLoading={isLoading}
        onReject={(req) => {
          setSelectedRequest(req);
          setRejectModalOpen(true);
        }}
        onPropose={(req) => {
          setSelectedRequest(req);
          setProposeModalOpen(true);
        }}
      />

      <CreateAppointmentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <RejectModal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />

      <ProposeTimeModal
        open={proposeModalOpen}
        onClose={() => {
          setProposeModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </div>
  );
}

function SpecialistView({
  requests,
  isLoading,
  onReject,
  onPropose,
}: {
  requests: AppointmentRequest[];
  isLoading: boolean;
  onReject: (req: AppointmentRequest) => void;
  onPropose: (req: AppointmentRequest) => void;
}) {
  const { user } = useAuth();
  const { data: practitioners } = usePractitioners();
  const approveAppointment = useApproveAppointment();
  const { toast } = useToast();
  const startCall = useStartCallFromAppointment();
  const router = useRouter();

  const currentPractitioner = practitioners?.find((p) => p.user_id === user?.user_id);
  const practitionerId = currentPractitioner?.practitioner_id;

  async function handleAppointmentCall(requestId: string) {
    try {
      const data = await startCall.mutateAsync(requestId);
      router.push(
        `/teleconsultations/${data.teleconsultation_id}?appointmentId=${requestId}`
      );
    } catch {
      toast("Could not start call. Try the Call page if no specialist is assigned.", "error");
    }
  }

  async function handleApprove(requestId: string) {
    try {
      await approveAppointment.mutateAsync(requestId);
      toast("Appointment approved", "success");
    } catch {
      toast("Failed to approve appointment", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12 text-slate-400" />}
        title="No appointment requests"
        description="When practitioners request appointments with you, they'll appear here"
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const isRequester = user?.user_id === request.requested_by_user_id;
        const isAssignedPractitioner =
          practitionerId && request.specialist_id === practitionerId;
        const canManage =
          !!isAssignedPractitioner && !isRequester && request.status === "PENDING";

        return (
        <Card key={request.request_id}>
          <CardContent className="py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="font-medium text-slate-900">
                    Appointment Request
                  </span>
                  <AppointmentStatusBadge status={request.status} />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>Requested for: {formatDate(request.proposed_datetime)}</span>
                </div>

                {request.requester_name && (
                  <p className="text-sm text-slate-700">
                    Requested by: <span className="font-medium">{request.requester_name}</span>
                  </p>
                )}

                {request.notes && (
                  <p className="text-sm text-slate-600">{request.notes}</p>
                )}

                {request.consultation_id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/consultations/${request.consultation_id}`}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View consultation →
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAppointmentCall(request.request_id)}
                      title="Join call"
                      loading={startCall.isPending}
                    >
                      <Phone className="mr-1 h-4 w-4" />
                      Call
                    </Button>
                  </div>
                )}
              </div>

              {canManage && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(request)}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPropose(request)}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Propose Time
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request.request_id)}
                    loading={approveAppointment.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )})}
    </div>
  );
}

function PractitionerView({
  requests,
  isLoading,
}: {
  requests: AppointmentRequest[];
  isLoading: boolean;
}) {
  const { user } = useAuth();
  const deleteAppointment = useDeleteAppointmentRequest();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12 text-slate-400" />}
        title="No appointment requests"
        description="Request an appointment with a specialist to get started"
      />
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {requests.map((apt) => (
        <Card key={apt.request_id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-900">
                      {formatDate(apt.proposed_datetime)}
                    </p>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-lg px-2.5 py-0.5 text-xs font-medium",
                        apt.status === "APPROVED" && "bg-green-100 text-green-800",
                        apt.status === "PENDING" && "bg-amber-100 text-amber-800",
                        apt.status === "REJECTED" && "bg-red-100 text-red-800",
                        apt.status === "RESCHEDULED" && "bg-blue-100 text-blue-800",
                        apt.status === "COMPLETED" && "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {apt.status}
                    </span>
                  </div>
                  {apt.specialist_name && (
                    <p className="mt-1 font-medium text-slate-800">{apt.specialist_name}</p>
                  )}
                  {apt.notes && (
                    <p className="mt-1 text-sm text-slate-500">{apt.notes}</p>
                  )}
                  {apt.consultation_id && (
                    <p className="mt-2">
                      <Link
                        href={`/consultations/${apt.consultation_id}`}
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        View consultation
                      </Link>
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {apt.consultation_id && (
                  <Link
                    href={`/consultations/${apt.consultation_id}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Consultation
                  </Link>
                )}
                {user?.user_id === apt.requested_by_user_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    onClick={async () => {
                      if (!window.confirm("Delete this appointment request?")) return;
                      try {
                        await deleteAppointment.mutateAsync(apt.request_id);
                        toast("Appointment deleted", "success");
                      } catch {
                        toast("Could not delete appointment", "error");
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RejectModal({
  open,
  onClose,
  request,
}: {
  open: boolean;
  onClose: () => void;
  request: AppointmentRequest | null;
}) {
  const [reason, setReason] = useState("");
  const rejectAppointment = useRejectAppointment();
  const { toast } = useToast();

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!request || !reason.trim()) return;

    try {
      await rejectAppointment.mutateAsync({
        requestId: request.request_id,
        reason,
      });
      toast("Appointment rejected", "success");
      onClose();
      setReason("");
    } catch {
      toast("Failed to reject appointment", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Reject Appointment">
      <form onSubmit={handleReject} className="space-y-4">
        <p className="text-sm text-slate-600">
          Please provide a reason for rejecting this appointment request.
        </p>

        <Textarea
          label="Rejection Reason"
          placeholder="Not available at this time, suggest contacting..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={3}
        />

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!reason.trim()}
            loading={rejectAppointment.isPending}
            className="flex-1"
          >
            Reject Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ProposeTimeModal({
  open,
  onClose,
  request,
}: {
  open: boolean;
  onClose: () => void;
  request: AppointmentRequest | null;
}) {
  const [datetime, setDatetime] = useState("");
  const proposeTime = useProposeAlternativeTime();
  const { toast } = useToast();

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    if (!request || !datetime) return;

    try {
      await proposeTime.mutateAsync({
        requestId: request.request_id,
        datetime,
      });
      toast("Alternative time proposed", "success");
      onClose();
      setDatetime("");
    } catch {
      toast("Failed to propose time", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Propose Alternative Time">
      <form onSubmit={handlePropose} className="space-y-4">
        <p className="text-sm text-slate-600">
          The practitioner originally requested:{" "}
          {request && formatDate(request.proposed_datetime)}
        </p>

        <Input
          type="datetime-local"
          label="Alternative Date & Time"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          required
        />

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!datetime}
            loading={proposeTime.isPending}
            className="flex-1"
          >
            Propose Time
          </Button>
        </div>
      </form>
    </Modal>
  );
}
