"use client";

import { PageHeader } from "@/components/layout/page-header";
import { UserTable } from "@/components/admin/user-table";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="View and manage patients (non-practitioner users)"
      />
      <UserTable />
    </div>
  );
}
