"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { Spinner } from "@/components/ui/spinner";

export function SpecialistGuard({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: practitioners, isLoading: practitionersLoading } = usePractitioners();
  const router = useRouter();

  const currentPractitioner = user
    ? practitioners?.find((p) => p.user_id === user.user_id)
    : undefined;
  const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";

  useEffect(() => {
    if (authLoading || practitionersLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "PRACTITIONER" || !isSpecialist) {
      router.replace("/dashboard");
    }
  }, [authLoading, practitionersLoading, user, isSpecialist, router]);

  if (authLoading || practitionersLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== "PRACTITIONER" || !isSpecialist) {
    return null;
  }

  return <>{children}</>;
}
