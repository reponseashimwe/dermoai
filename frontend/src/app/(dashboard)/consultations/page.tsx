"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ConsultationList } from "@/components/consultations/consultation-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ConsultationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description="View and manage your consultations"
        action={
          <Link href="/consultations/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Consultation
            </Button>
          </Link>
        }
      />
      <ConsultationList />
    </div>
  );
}
