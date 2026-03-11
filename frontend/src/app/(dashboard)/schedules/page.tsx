"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useAppointmentsForMyConsultations, useStartCallFromAppointment, useDeleteAppointmentRequest } from "@/hooks/use-appointments";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Calendar, Video, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function SchedulesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { data: appointments, isLoading } = useAppointmentsForMyConsultations();
  const startCall = useStartCallFromAppointment();
  const deleteAppointment = useDeleteAppointmentRequest();

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

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    await deleteAppointment.mutateAsync(deleteTargetId);
    toast("Appointment deleted", "success");
    setDeleteTargetId(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const list = appointments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedules"
        description="Appointments and scheduled calls linked to your consultations"
      />

      {list.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12 text-slate-400" />}
          title="No scheduled appointments"
          description="When appointments are scheduled for your consultations, they will appear here."
          action={{
            label: "View consultations",
            onClick: () => router.push("/consultations"),
          }}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {list.map((apt) => (
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
                      <p className="text-sm text-slate-500">
                        Specialist: Dermatology
                      </p>
                      {apt.notes && (
                        <p className="mt-1 text-sm text-slate-500">{apt.notes}</p>
                      )}
                      {apt.consultation_id && (
                        <p className="mt-2">
                          <Link
                            href={`/consultations/${apt.consultation_id}`}
                            className="text-sm font-medium text-primary-600 hover:underline"
                          >
                            View
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAppointmentCall(apt.request_id)}
                      loading={startCall.isPending}
                      title="Join call"
                    >
                      <Video className="h-4 w-4 mr-1.5" />
                      Join
                    </Button>
                    {user?.user_id === apt.requested_by_user_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        onClick={() => setDeleteTargetId(apt.request_id)}
                        title="Delete appointment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        title="Delete appointment"
        description="This appointment will be removed. You can create a new one from the consultation if needed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        loading={deleteAppointment.isPending}
      />
    </div>
  );
}
