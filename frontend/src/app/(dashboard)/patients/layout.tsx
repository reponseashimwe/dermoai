"use client";

import { AuthGuard } from "@/components/auth/auth-guard";

export default function PatientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRoles={["PRACTITIONER", "ADMIN"]}>
      {children}
    </AuthGuard>
  );
}
