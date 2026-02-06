"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function ConsentCheckbox({
  checked,
  onChange,
  className,
}: ConsentCheckboxProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-2.5 transition-colors hover:bg-slate-50 sm:p-3",
        checked && "border-primary-300 bg-primary-50/60",
        className
      )}
    >
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          aria-describedby="consent-description"
        />
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors sm:h-[22px] sm:w-[22px]",
            checked
              ? "border-primary-500 bg-primary-500 text-white"
              : "border-slate-300 bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/30"
          )}
          aria-hidden
        >
          {checked && <Check className="h-3 w-3 stroke-[2.5] sm:h-3.5 sm:w-3.5" />}
        </span>
      </span>
      <span id="consent-description" className="text-xs text-slate-600 sm:text-sm">
        I consent to my image being stored and potentially used for improving
        the AI model. My image will be anonymized and handled securely.
      </span>
    </label>
  );
}
