"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types/api";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: { href: string; label: string }[];
  user: User | null;
}

export function MobileNav({ open, onClose, items, user }: MobileNavProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 border-t border-slate-200 pt-6">
          {user ? (
            <div className="space-y-3">
              <Link href="/profile" onClick={onClose}>
                <Button variant="outline" className="w-full">
                  Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={onClose}>
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" onClick={onClose}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
