import type { LucideIcon } from "lucide-react";
import { ArrowRightCircle, ShieldCheck, Stethoscope } from "lucide-react";

export type UrgencyLevel = "REFER" | "MANAGE LOCALLY";

export const URGENCY_INFO: Record<UrgencyLevel, { label: string; color: string; bgColor: string; borderColor: string; icon: LucideIcon }> = {
  REFER: { label: "Refer", color: "text-amber-600", bgColor: "bg-amber-100", borderColor: "border-amber-200", icon: ArrowRightCircle },
  "MANAGE LOCALLY": { label: "Manage Locally", color: "text-primary-600", bgColor: "bg-primary-100", borderColor: "border-primary-200", icon: Stethoscope },
};

/** Fallback when API returns an unknown urgency value. */
export const URGENCY_FALLBACK: { label: string; color: string; bgColor: string; borderColor: string; icon: LucideIcon } = {
  label: "Review",
  color: "text-slate-600",
  bgColor: "bg-slate-100",
  borderColor: "border-slate-200",
  icon: ShieldCheck,
};
