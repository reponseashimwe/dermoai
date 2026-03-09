import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

const alertVariants = cva(
  "flex items-start gap-3 rounded-lg border p-4 text-sm",
  {
    variants: {
      variant: {
        info: "border-blue-200 bg-blue-50 text-blue-800",
        success: "border-green-200 bg-green-50 text-green-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        error: "border-red-200 bg-red-50 text-red-800",
        neutral: "border-slate-200 bg-white text-slate-800",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** When false, only children are rendered (no built-in icon). Use for custom icon in content. */
  showIcon?: boolean;
}

function Alert({ className, variant = "info", showIcon = true, children, ...props }: AlertProps) {
  const Icon = variant === "neutral" ? null : iconMap[variant || "info"];
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      {showIcon && Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

export { Alert };
