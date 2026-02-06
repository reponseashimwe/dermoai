"use client";

import { PageHeader } from "@/components/layout/page-header";
import { UserTable } from "@/components/admin/user-table";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage all registered users"
      />
      <UserTable />
    </div>
  );
}
