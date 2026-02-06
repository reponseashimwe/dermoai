"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { AdminStatsCards } from "@/components/admin/admin-stats-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, Users, Brain } from "lucide-react";

const quickLinks = [
  {
    href: "/admin/practitioners",
    label: "Practitioner Approvals",
    description: "Review and approve pending practitioners",
    icon: UserCheck,
  },
  {
    href: "/admin/users",
    label: "User Management",
    description: "View and manage all users",
    icon: Users,
  },
  {
    href: "/admin/retraining-logs",
    label: "Retraining Logs",
    description: "View model retraining history",
    icon: Brain,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Manage practitioners, users, and model retraining"
      />

      <AdminStatsCards />

      <div className="grid gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <link.icon className="h-5 w-5 text-primary-700" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">
                  {link.label}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {link.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
