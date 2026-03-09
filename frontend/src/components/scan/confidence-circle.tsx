"use client";

import { cn } from "@/lib/utils";

interface ConfidenceCircleProps {
	/** 0–1 */
	value: number;
	urgency?: "REFER" | "MANAGE LOCALLY" | string;
	size?: number;
	strokeWidth?: number;
	className?: string;
}

export function ConfidenceCircle({
	value,
	urgency,
	size = 120,
	strokeWidth = 10,
	className,
}: ConfidenceCircleProps) {
	const percentage = Math.round(value * 1000) / 10;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const filled = value * circumference;
	const color =
		urgency === "REFER"
			? "stroke-amber-500"
			: "stroke-primary-600";

	return (
		<div
			className={cn("relative inline-flex items-center justify-center", className)}
			style={{ width: size, height: size }}
			aria-label={`Confidence ${percentage}%`}
		>
			<svg width={size} height={size} className="-rotate-90" aria-hidden>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					className="stroke-slate-300"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={circumference - filled}
					strokeLinecap="round"
					className={cn("transition-all duration-500", color)}
				/>
			</svg>
			<span
				className={cn(
					"absolute text-center font-bold tabular-nums",
					size <= 56 ? "text-xs text-slate-900" : size <= 80 ? "text-sm text-slate-900" : "text-lg text-slate-900"
				)}
			>
				{percentage}%
			</span>
		</div>
	);
}
