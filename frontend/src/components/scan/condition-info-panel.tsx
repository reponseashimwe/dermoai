"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONDITION_INFO } from "@/lib/constants/conditions";
import { formatConditionName } from "@/lib/utils";

interface ConditionInfoPanelProps {
  condition: string;
  className?: string;
}

export function ConditionInfoPanel({
  condition,
  className,
}: ConditionInfoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const info = CONDITION_INFO[condition] || CONDITION_INFO.other;

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-slate-50",
        className
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-slate-700">
            About {info.displayName || formatConditionName(condition)}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-slate-200 px-4 py-3 text-sm">
          <p className="text-slate-600">{info.description}</p>
          <div className="mt-3">
            <p className="font-medium text-slate-700">Recommended Action:</p>
            <p className="mt-1 text-slate-600">{info.recommendedAction}</p>
          </div>
        </div>
      )}
    </div>
  );
}
