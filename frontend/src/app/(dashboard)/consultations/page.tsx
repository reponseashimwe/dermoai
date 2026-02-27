"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ConsultationList } from "@/components/consultations/consultation-list";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Calendar } from "lucide-react";

export default function ConsultationsPage() {
  const { user } = useAuth();
  const isPractitioner = user?.role === "PRACTITIONER";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description={
          isPractitioner
            ? "View and manage consultations. Request appointments for specialist review."
            : "View and manage your consultations"
        }
        action={
          <div className="flex gap-2">
            {isPractitioner && (
              <Link href="/appointments">
                <Button variant="outline">
                  <Calendar className="h-4 w-4" />
                  Appointments
                </Button>
              </Link>
            )}
            <Link href="/consultations/new">
              <Button>
                <Plus className="h-4 w-4" />
                New Consultation
              </Button>
            </Link>
          </div>
        }
      />
      <ConsultationList />
    </div>
  );
}
