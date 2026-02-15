"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <AuthGuard requiredRoles={["ADMIN"]}>
      <div className="min-h-screen bg-slate-50">
        <Sidebar user={user} />

        <div className="md:ml-[80px]">
          <DashboardHeader />
          <main className="px-4 py-6 pb-20 md:px-6 md:pb-6">
            {children}
          </main>
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
