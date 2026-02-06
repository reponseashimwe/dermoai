import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
}

const sizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

const iconSizeMap = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const svgSizeMap = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

export function Logo({ className, size = "md", iconOnly = false }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary-500",
          iconSizeMap[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn("text-white", svgSizeMap[size])}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
          <path d="M19 10a7 7 0 0 1-14 0" />
          <path d="M12 18v4" />
          <path d="M8 22h8" />
        </svg>
      </div>
      {!iconOnly && (
        <span
          className={cn(
            "font-bold tracking-tight text-slate-900",
            sizeMap[size]
          )}
        >
          Dermo<span className="text-primary-500">AI</span>
        </span>
      )}
    </Link>
  );
}
