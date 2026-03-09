"use client";

import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-stats";
import { useAppointmentsForMyConsultations } from "@/hooks/use-appointments";
import { usePractitionerStats } from "@/hooks/use-stats";
import { useIncomingTeleconsultations } from "@/hooks/use-teleconsultations";

/**
 * Returns the number of "alerts" to show in the sidebar badge for the current user.
 * USER: referral notifications + upcoming appointments.
 * PRACTITIONER: cases to refer + incoming calls.
 */
export function useAlertCount(): number {
  const { user } = useAuth();
  const { data: userStats } = useUserStats(!!user && user.role === "USER");
  const { data: appointments } = useAppointmentsForMyConsultations();
  const { data: practitionerStats } = usePractitionerStats(!!user && user.role === "PRACTITIONER");
  const { data: incomingCalls } = useIncomingTeleconsultations();

  if (!user) return 0;
  if (user.role === "USER") {
    const referral = (userStats && "urgent_alerts" in userStats ? userStats.urgent_alerts : 0) ?? 0;
    const upcoming = appointments?.length ?? 0;
    return referral + upcoming;
  }
  if (user.role === "PRACTITIONER") {
    const toRefer = (practitionerStats && "urgent_cases" in practitionerStats ? practitionerStats.urgent_cases : 0) ?? 0;
    const incoming = incomingCalls?.length ?? 0;
    return toRefer + incoming;
  }
  return 0;
}
