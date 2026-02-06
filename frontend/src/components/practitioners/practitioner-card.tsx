import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalStatusBadge } from "./approval-status-badge";
import { Stethoscope } from "lucide-react";
import type { Practitioner } from "@/types/api";

interface PractitionerCardProps {
  practitioner: Practitioner;
  actions?: React.ReactNode;
}

export function PractitionerCard({
  practitioner,
  actions,
}: PractitionerCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
          <Stethoscope className="h-5 w-5 text-primary-700" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">
              Practitioner #{practitioner.practitioner_id.slice(0, 8)}
            </p>
            <Badge variant="info">{practitioner.practitioner_type}</Badge>
          </div>
          {practitioner.expertise && (
            <p className="text-sm text-slate-500">{practitioner.expertise}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ApprovalStatusBadge status={practitioner.approval_status} />
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
