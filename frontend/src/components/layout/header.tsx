"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, isLoading } = useAuth();

  return (
    <header className="shrink-0 bg-white font-sans py-4 min-h-[64px] sm:py-5 sm:min-h-[72px] lg:py-6 lg:min-h-[80px]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[44px] min-w-[44px] items-center">
          <Logo size="sm" />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {!isLoading && !user && (
            <>
              <Link href="/login" className="flex min-h-[44px] min-w-[44px] items-center justify-center sm:min-h-0 sm:min-w-0">
                <Button variant="ghost" size="sm" className="text-sm font-medium">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="flex min-h-[44px] items-center sm:min-h-0">
                <Button size="sm" className="text-sm font-medium">Get Started</Button>
              </Link>
            </>
          )}

          {!isLoading && user && (
            <>
              <Link href="/dashboard" className="flex min-h-[44px] items-center sm:min-h-0">
                <Button size="sm" className="text-sm font-medium">Dashboard</Button>
              </Link>
              <Link href="/profile" className="flex min-h-[44px] min-w-[44px] items-center justify-center sm:min-h-0 sm:min-w-0" aria-label="Profile">
                <Avatar name={user.name} size="lg" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
