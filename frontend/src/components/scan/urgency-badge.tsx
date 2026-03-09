import { cn } from "@/lib/utils";
import { URGENCY_INFO, URGENCY_FALLBACK, type UrgencyLevel } from "@/lib/constants/urgency";

interface UrgencyBadgeProps {
  urgency: UrgencyLevel | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export function UrgencyBadge({
  urgency,
  size = "md",
  className,
}: UrgencyBadgeProps) {
  const info = urgency in URGENCY_INFO ? URGENCY_INFO[urgency as UrgencyLevel] : URGENCY_FALLBACK;
  const Icon = info.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        info.bgColor,
        info.color,
        sizeMap[size],
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {info.label}
    </span>
  );
}
