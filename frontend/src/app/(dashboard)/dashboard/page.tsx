"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { PractitionerDashboard } from "@/components/dashboard/practitioner-dashboard";
import { SpecialistDashboard } from "@/components/dashboard/specialist-dashboard";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { data: practitioners, isLoading: practitionersLoading } = usePractitioners();

  const currentPractitioner = user
    ? practitioners?.find((p) => p.user_id === user.user_id)
    : undefined;
  const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";

  const waitForPractitioners = user?.role === "PRACTITIONER" && practitionersLoading;

  if (isLoading || waitForPractitioners) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (user?.role === "ADMIN") return <AdminDashboard />;
  if (user?.role === "PRACTITIONER") {
    return isSpecialist ? <SpecialistDashboard /> : <PractitionerDashboard />;
  }
  return <UserDashboard />;
}
