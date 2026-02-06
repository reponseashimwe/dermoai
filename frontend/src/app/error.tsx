"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <AlertTriangle className="mb-4 h-16 w-16 text-amber-500" />
      <h1 className="text-3xl font-bold text-slate-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-slate-500">
        An unexpected error occurred. Please try again or contact support if the
        issue persists.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
