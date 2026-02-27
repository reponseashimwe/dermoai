"use client";

import { SpecialistGuard } from "@/components/auth/specialist-guard";

export default function ReviewQueueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SpecialistGuard>{children}</SpecialistGuard>;
}
