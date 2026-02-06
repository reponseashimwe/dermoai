import { AlertTriangle, ShieldCheck } from "lucide-react";

export const URGENCY_INFO = {
  URGENT: {
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    icon: AlertTriangle,
  },
  NON_URGENT: {
    label: "Non-Urgent",
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    icon: ShieldCheck,
  },
} as const;
