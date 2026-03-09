"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  className,
  children,
}: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/30",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </button>
  );
}
