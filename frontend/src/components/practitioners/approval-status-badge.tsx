import { Badge } from "@/components/ui/badge";

const statusMap = {
  PENDING: { label: "Pending", variant: "warning" as const },
  APPROVED: { label: "Approved", variant: "safe" as const },
  REJECTED: { label: "Rejected", variant: "urgent" as const },
};

interface ApprovalStatusBadgeProps {
  status: string;
}

export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  const info = statusMap[status as keyof typeof statusMap] || {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
