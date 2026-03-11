"use client";

import { useAuth } from "@/hooks/use-auth";
import { useAppointmentsForMyConsultations } from "@/hooks/use-appointments";
import { useIncomingTeleconsultations } from "@/hooks/use-teleconsultations";
import { useConsultations } from "@/hooks/use-consultations";
import { usePractitioners } from "@/hooks/use-practitioners";

/**
 * Returns the number of alerts to show in the sidebar badge.
 *
 * USER: one alert per open REFER consultation they created + upcoming appointments.
 * PRACTITIONER (GP): one alert per open REFER consultation they can see + incoming calls.
 * PRACTITIONER (specialist): only incoming calls count.
 */
export function useAlertCount(): number {
  const { user } = useAuth();
  const { data: consultations } = useConsultations();
  const { data: appointments } = useAppointmentsForMyConsultations();
  const isPractitioner = user?.role === "PRACTITIONER";
  const { data: incomingCalls } = useIncomingTeleconsultations(!!user && isPractitioner);
  const { data: practitioners } = usePractitioners();

  if (!user) return 0;

  const activeReferConsults =
    consultations?.filter(
      (c) => c.status !== "CLOSED" && c.urgency === "REFER",
    ) ?? [];

  if (user.role === "USER") {
    const referral = activeReferConsults.length;
    const upcoming = appointments?.length ?? 0;
    return referral + upcoming;
  }

  if (user.role === "PRACTITIONER") {
    const currentPractitioner = practitioners?.find(
      (p) => p.user_id === user.user_id,
    );
    const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";

    const toRefer = isSpecialist ? 0 : activeReferConsults.length;
    const incoming = incomingCalls?.length ?? 0;
    return toRefer + incoming;
  }

  return 0;
}
