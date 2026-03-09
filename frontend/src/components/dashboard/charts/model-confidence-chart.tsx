"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ConfidenceTrendPoint } from "@/types/api";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ModelConfidenceChartProps {
	data: ConfidenceTrendPoint[];
	avgConfidence: number;
	/** When true, render content only (no Card) for embedding in another card */
	embedded?: boolean;
}

const emptyState = (embedded: boolean) =>
	embedded ? (
		<div className='space-y-2'>
			<h3 className='text-sm font-semibold text-slate-900'>Model Confidence Trends</h3>
			<p className='text-sm text-slate-500'>No data available</p>
		</div>
	) : (
		<Card>
			<CardHeader>
				<h3 className='text-base font-semibold text-slate-900'>Model Confidence Trends</h3>
			</CardHeader>
			<CardContent>
				<p className='text-sm text-slate-500'>No data available</p>
			</CardContent>
		</Card>
	);

export function ModelConfidenceChart({ data, avgConfidence, embedded = false }: ModelConfidenceChartProps) {
	if (data.length === 0) return emptyState(embedded);

	const maxConfidence = Math.max(...data.map((d) => d.avg_confidence));
	const minConfidence = Math.min(...data.map((d) => d.avg_confidence));
	const trend = data.length > 1 ? data[data.length - 1].avg_confidence - data[0].avg_confidence : 0;

	const header = (
		<div className='flex items-start justify-between'>
			<div>
				<h3
					className={
						embedded ? "text-sm font-semibold text-slate-900" : "text-base font-semibold text-slate-900"
					}
				>
					Model Confidence Trends
				</h3>
				<p className='text-sm text-slate-500'>Last 8 weeks</p>
			</div>
			<div className='text-right'>
				<p className={embedded ? "text-xl font-bold text-slate-900" : "text-2xl font-bold text-slate-900"}>
					{(avgConfidence * 100).toFixed(1)}%
				</p>
				<div className='flex items-center gap-1 text-sm'>
					{trend >= 0 ? (
						<TrendingUp className='h-4 w-4 text-green-600' />
					) : (
						<TrendingDown className='h-4 w-4 text-red-600' />
					)}
					<span className={trend >= 0 ? "text-green-700" : "text-red-700"}>
						{trend >= 0 ? "+" : ""}
						{(trend * 100).toFixed(1)}%
					</span>
				</div>
			</div>
		</div>
	);

	const chart = (
		<div className='flex items-end gap-1 h-32'>
			{data.map((point, i) => {
				const height = ((point.avg_confidence - minConfidence) / (maxConfidence - minConfidence || 1)) * 100;
				const date = new Date(point.week);
				const label = `${date.getMonth() + 1}/${date.getDate()}`;
				return (
					<div
						key={i}
						className='flex-1 flex flex-col items-center gap-1'
					>
						<div className='w-full flex items-end h-full'>
							<div
								className='w-full bg-primary-500 rounded-t hover:bg-primary-600 transition-colors relative group'
								style={{ height: `${height}%`, minHeight: "8px" }}
							>
								<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap'>
									{(point.avg_confidence * 100).toFixed(1)}% ({point.count})
								</div>
							</div>
						</div>
						<span className='text-xs text-slate-500'>{label}</span>
					</div>
				);
			})}
		</div>
	);

	if (embedded) {
		return (
			<div className='space-y-3'>
				{header}
				{chart}
			</div>
		);
	}
	return (
		<Card>
			<CardHeader>{header}</CardHeader>
			<CardContent>{chart}</CardContent>
		</Card>
	);
}
