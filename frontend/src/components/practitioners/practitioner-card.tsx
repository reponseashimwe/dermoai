import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ApprovalStatusBadge } from "./approval-status-badge";
import type { Practitioner, PractitionerAvailable } from "@/types/api";

interface PractitionerCardProps {
  practitioner: Practitioner | PractitionerAvailable;
  actions?: React.ReactNode;
}

function hasNameEmail(
  p: Practitioner | PractitionerAvailable
): p is PractitionerAvailable {
  return "name" in p && "email" in p;
}

export function PractitionerCard({
  practitioner,
  actions,
}: PractitionerCardProps) {
  const name =
    hasNameEmail(practitioner) && practitioner.name
      ? practitioner.name
      : null;
  const email =
    hasNameEmail(practitioner) && practitioner.email
      ? practitioner.email
      : null;
  const displayName = name || `Practitioner #${practitioner.practitioner_id.slice(0, 8)}`;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 py-3 px-4 sm:flex-nowrap sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-initial sm:flex-1">
          <Avatar
            name={displayName}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{displayName}</p>
            {email ? (
              <p className="truncate text-xs text-slate-500">{email}</p>
            ) : (
              practitioner.expertise && (
                <p className="truncate text-xs text-slate-500">
                  {practitioner.expertise}
                </p>
              )
            )}
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          <Badge variant="info">{practitioner.practitioner_type}</Badge>
          <ApprovalStatusBadge status={practitioner.approval_status} />
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
