"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
