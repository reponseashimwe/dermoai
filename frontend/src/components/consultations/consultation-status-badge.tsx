import { Badge } from "@/components/ui/badge";

const statusMap = {
  OPEN: { label: "Open", variant: "info" as const },
  IN_REVIEW: { label: "In Review", variant: "warning" as const },
  CLOSED: { label: "Closed", variant: "default" as const },
};

interface ConsultationStatusBadgeProps {
  status: string;
}

export function ConsultationStatusBadge({
  status,
}: ConsultationStatusBadgeProps) {
  const info = statusMap[status as keyof typeof statusMap] || {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
