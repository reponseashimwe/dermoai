"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TeleconsultationListener } from "@/components/telemedicine/teleconsultation-listener";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <TeleconsultationListener />
      <div className="min-h-screen bg-slate-100">
        <Sidebar user={user} />

        {/* Main area — offset by sidebar on desktop, light grey content area per reference */}
        <div className="md:ml-[80px]">
          <DashboardHeader />
          <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 pb-20 md:px-6 md:pb-6">
            {children}
          </main>
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
