import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-1
  urgency?: "URGENT" | "NON_URGENT";
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  urgency,
  className,
  showLabel = true,
}: ProgressBarProps) {
  const percentage = Math.round(value * 100);
  const barColor =
    urgency === "URGENT"
      ? "bg-red-500"
      : urgency === "NON_URGENT"
      ? "bg-green-500"
      : "bg-primary-600";

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Confidence</span>
          <span className="font-medium text-slate-900">{percentage}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
