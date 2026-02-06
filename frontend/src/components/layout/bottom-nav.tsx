"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  ScanLine,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/consultations", label: "Consults", icon: ClipboardList },
  { href: "/scan-history", label: "Scan", icon: ScanLine, primary: true },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-14 items-center justify-around">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex -mt-4 h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg"
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-primary-500" : "text-slate-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
