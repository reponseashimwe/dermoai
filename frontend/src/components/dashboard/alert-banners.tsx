"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { AlertTriangle, Calendar } from "lucide-react";

export interface AlertBannersProps {
  /** Number of referral/urgent notifications (e.g. from user stats). */
  referralCount: number;
  /** Number of upcoming appointments. */
  upcomingCount: number;
}

export function AlertBanners({ referralCount, upcomingCount }: AlertBannersProps) {
  const hasReferral = referralCount > 0;
  const hasUpcoming = upcomingCount > 0;
  if (!hasReferral && !hasUpcoming) return null;

  return (
    <div className="flex flex-col gap-3">
      {hasReferral && (
        <Link href="/consultations">
          <Alert variant="neutral" showIcon={false} className="cursor-pointer transition-colors border border-slate-200 bg-white hover:bg-slate-50 py-4 px-4">
            <span className="flex flex-wrap items-center justify-between gap-2 font-medium">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <span className="text-slate-800">
                  You have {referralCount} referral notification{referralCount !== 1 ? "s" : ""}.
                </span>
              </span>
              <span className="text-primary-600 underline">View consultations →</span>
            </span>
          </Alert>
        </Link>
      )}
      {hasUpcoming && (
        <Link href="/schedules">
          <Alert variant="neutral" showIcon={false} className="cursor-pointer transition-colors border border-slate-200 bg-white hover:bg-slate-50 py-4 px-4">
            <span className="flex flex-wrap items-center justify-between gap-2 font-medium">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600">
                  <Calendar className="h-5 w-5" />
                </span>
                <span className="text-slate-800">
                  You have {upcomingCount} upcoming appointment{upcomingCount !== 1 ? "s" : ""}.
                </span>
              </span>
              <span className="text-primary-600 underline">View schedules →</span>
            </span>
          </Alert>
        </Link>
      )}
    </div>
  );
}
