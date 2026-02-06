"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  ClipboardList,
  Users,
  History,
  ShieldCheck,
  UserCog,
  Database,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import type { User } from "@/types/api";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: SidebarItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/scan-history", label: "Scans", icon: History, roles: ["USER", "PRACTITIONER", "ADMIN"] },
  { href: "/consultations", label: "Consults", icon: ClipboardList, roles: ["USER", "PRACTITIONER", "ADMIN"] },
  { href: "/patients", label: "Patients", icon: Users, roles: ["USER", "PRACTITIONER", "ADMIN"] },
  { href: "/notifications", label: "Alerts", icon: Bell, roles: ["USER", "PRACTITIONER", "ADMIN"] },
];

const adminItems: SidebarItem[] = [
  { href: "/admin", label: "Admin", icon: ShieldCheck, roles: ["ADMIN"] },
  { href: "/admin/practitioners", label: "Doctors", icon: UserCog, roles: ["ADMIN"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/retraining-logs", label: "Models", icon: Database, roles: ["ADMIN"] },
];

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();

  const visibleNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );
  const visibleAdmin = adminItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[80px] flex-col border-r border-slate-200 bg-white md:flex">
      {/* Prominent logo at top — reference: large logo area with generous spacing */}
      <div className="flex shrink-0 flex-col items-center gap-3 border-b border-slate-100 px-3 py-6">
        <Logo size="md" iconOnly />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-0.5 overflow-y-auto px-2 py-5">
        {visibleNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <item.icon className={cn("h-6 w-6", active && "text-primary-600")} />
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}

        {visibleAdmin.length > 0 && (
          <>
            <div className="my-3 h-px w-10 bg-slate-200" />
            {visibleAdmin.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary-50 text-primary-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <item.icon className={cn("h-6 w-6", active && "text-primary-600")} />
                  <span className="leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Primary action — reference: prominent button at bottom */}
      <div className="flex shrink-0 items-center justify-center border-t border-slate-100 px-3 py-5">
        <Link
          href="/scan-history"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm transition-colors hover:bg-primary-600"
          title="New scan"
        >
          <ScanLine className="h-6 w-6" />
        </Link>
      </div>
    </aside>
  );
}
