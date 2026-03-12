"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

/** Icon box: primary for all stat cards */
const iconBoxClass = "bg-primary-700 text-white";

/** Card: white background */
const cardBgClasses = {
	blue: "border border-slate-200 bg-white",
	green: "border border-slate-200 bg-white",
	primary: "border border-slate-200 bg-white",
	amber: "border border-slate-200 bg-white",
	purple: "border border-slate-200 bg-white",
	red: "border border-slate-200 bg-white",
} as const;

export interface StatCardProps {
	label: string;
	value: string | number;
	icon: LucideIcon;
	color: keyof typeof cardBgClasses;
	trend?: { value: number; direction: "up" | "down" };
	subtext?: string;
	/** Compact style for top row (4 per row) */
	compact?: boolean;
	/** When set, the card is a link to this href */
	href?: string;
}

const cardContentClass = (compact: boolean) =>
	compact ? "flex items-center gap-3 py-6 px-4" : "flex items-center gap-3 py-5 px-4 sm:py-6 sm:px-5";

const innerContent = (
	Icon: LucideIcon,
	label: string,
	value: string | number,
	trend: StatCardProps["trend"],
	subtext: string | undefined,
	compact: boolean,
) => (
	<>
		<div
			className={`flex shrink-0 items-center justify-center rounded-lg ${
				compact ? "h-9 w-9" : "h-8 w-8 sm:h-9 sm:w-9"
			} ${iconBoxClass}`}
		>
			<Icon className={compact ? "h-4 w-4" : "h-4 w-4 sm:h-4 sm:w-4"} />
		</div>
		<div className='min-w-0 flex-1'>
			<p
				className={
					compact
						? "text-xl font-bold text-slate-900 sm:text-2xl"
						: "text-lg font-bold text-slate-900 sm:text-xl"
				}
			>
				{value}
			</p>
			<p className={compact ? "text-sm text-slate-500" : "text-sm text-slate-500"}>
				{label}
				{subtext != null && subtext !== "" && <span className='text-slate-400'> · {subtext}</span>}
			</p>
			{trend != null && (
				<p
					className={`mt-0.5 text-xs font-medium ${
						trend.direction === "up" ? "text-primary-600" : "text-red-600"
					}`}
				>
					{trend.direction === "up" ? "↑" : "↓"} {trend.value}%
				</p>
			)}
		</div>
	</>
);

export function StatCard({ label, value, icon: Icon, color, trend, subtext, compact, href }: StatCardProps) {
	const content = (
		<Card className={cardBgClasses[color]}>
			<CardContent className={cardContentClass(!!compact)}>
				{innerContent(Icon, label, value, trend, subtext, !!compact)}
			</CardContent>
		</Card>
	);

	if (href) {
		return (
			<Link
				href={href}
				className='block transition-opacity hover:opacity-90'
			>
				{content}
			</Link>
		);
	}

	return content;
}
