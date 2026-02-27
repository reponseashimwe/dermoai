"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import {
  useMyAppointmentRequests,
  useIncomingAppointmentRequests,
  useApproveAppointment,
  useRejectAppointment,
  useProposeAlternativeTime,
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
  const { data: myRequests, isLoading: loadingMy } = useMyAppointmentRequests();
  const { data: incomingRequests, isLoading: loadingIncoming } = useIncomingAppointmentRequests();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);

  const currentPractitioner = practitioners?.find((p) => p.user_id === user?.user_id);
  const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description={
          isSpecialist
            ? "Manage incoming appointment requests from general practitioners"
            : "Request appointments with specialists for teleconsultations"
        }
        action={
          !isSpecialist ? (
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Calendar className="h-4 w-4" />
              Request Appointment
            </Button>
          ) : undefined
        }
      />

      {isSpecialist ? (
        <SpecialistView
          requests={incomingRequests ?? []}
          isLoading={loadingIncoming}
          onReject={(req) => {
            setSelectedRequest(req);
            setRejectModalOpen(true);
          }}
          onPropose={(req) => {
            setSelectedRequest(req);
            setProposeModalOpen(true);
          }}
        />
      ) : (
        <PractitionerView requests={myRequests ?? []} isLoading={loadingMy} />
      )}

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
  const approveAppointment = useApproveAppointment();
  const { toast } = useToast();

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
      {requests.map((request) => (
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
                    <Link href={`/telemedicine?consultationId=${request.consultation_id}`}>
                      <Button size="sm" variant="outline">
                        <Phone className="mr-1 h-4 w-4" />
                        Call
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {request.status === "PENDING" && (
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
      ))}
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
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.request_id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-700">
                    {formatDate(request.proposed_datetime)}
                  </span>
                  <AppointmentStatusBadge status={request.status} />
                </div>

                {request.specialist_name && (
                  <p className="text-sm text-slate-700">
                    With: <span className="font-medium">{request.specialist_name}</span>
                  </p>
                )}

                {request.specialist_proposed_datetime && (
                  <div className="text-sm text-blue-700">
                    Alternative time proposed: {formatDate(request.specialist_proposed_datetime)}
                  </div>
                )}

                {request.rejection_reason && (
                  <p className="text-sm text-red-700">
                    Rejection reason: {request.rejection_reason}
                  </p>
                )}

                {request.notes && (
                  <p className="text-sm text-slate-600">{request.notes}</p>
                )}

                {request.consultation_id && (
                  <Link
                    href={`/consultations/${request.consultation_id}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View consultation →
                  </Link>
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
