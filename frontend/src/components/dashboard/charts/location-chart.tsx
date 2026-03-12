"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PROVINCES } from "@/lib/locations";

const BAR_COLORS = ["#078ece", "#16A34A", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#EC4899", "#84CC16"];

const PROVINCE_COLORS: Record<string, string> = {
	kigali: "#078ece",
	northern: "#16A34A",
	southern: "#F59E0B",
	eastern: "#8B5CF6",
	western: "#EF4444",
};

interface LocationChartProps {
	data: Array<{ district: string; count: number }>;
}

/** Build a case-insensitive district-label → province lookup once. */
function buildDistrictMap(): Map<string, { value: string; label: string }> {
	const map = new Map<string, { value: string; label: string }>();
	for (const province of PROVINCES) {
		for (const district of province.districts) {
			map.set(district.label.toLowerCase(), {
				value: province.value,
				label: province.label,
			});
		}
	}
	return map;
}

const DISTRICT_TO_PROVINCE = buildDistrictMap();

export function LocationChart({ data }: LocationChartProps) {
	if (data.length === 0) {
		return <div className='flex h-64 items-center justify-center text-sm text-slate-500'>No location data yet</div>;
	}

	// Aggregate district counts into province totals
	const provinceTotals = new Map<string, { label: string; count: number; color: string }>();
	let unmatched = 0;

	for (const item of data) {
		const prov = DISTRICT_TO_PROVINCE.get(item.district.toLowerCase());
		if (prov) {
			const existing = provinceTotals.get(prov.value);
			if (existing) {
				existing.count += item.count;
			} else {
				provinceTotals.set(prov.value, {
					label: prov.label,
					count: item.count,
					color: PROVINCE_COLORS[prov.value] ?? "#94A3B8",
				});
			}
		} else {
			unmatched += item.count;
		}
	}

	if (unmatched > 0) {
		provinceTotals.set("other", {
			label: "Other",
			count: unmatched,
			color: "#94A3B8",
		});
	}

	const provinceData = Array.from(provinceTotals.values()).sort((a, b) => b.count - a.count);
	const maxCount = Math.max(...provinceData.map((p) => p.count), 1);

	return (
		<div className='space-y-5'>
			{/* District bar chart */}
			<ResponsiveContainer
				width='100%'
				height={200}
			>
				<BarChart
					data={data}
					margin={{ top: 4, right: 10, left: 0, bottom: 20 }}
				>
					<CartesianGrid
						strokeDasharray='3 3'
						stroke='#E2E8F0'
					/>
					<XAxis
						dataKey='district'
						tick={{ fontSize: 11, fill: "#64748B" }}
						angle={-45}
						textAnchor='end'
						height={45}
					/>
					<YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
					<Tooltip
						contentStyle={{
							backgroundColor: "#FFF",
							border: "1px solid #E2E8F0",
							borderRadius: "8px",
							fontSize: "12px",
						}}
					/>
					<Bar
						dataKey='count'
						radius={[6, 6, 0, 0]}
					>
						{data.map((_, index) => (
							<Cell
								key={index}
								fill={BAR_COLORS[index % BAR_COLORS.length]}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>

			{/* Province progress bars */}
			<div className='space-y-2.5 border-t border-slate-100 pt-4'>
				<p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>By Province</p>
				{provinceData.map((prov) => (
					<div
						key={prov.label}
						className='flex items-center justify-between'
					>
						<div className='flex items-center justify-between text-xs'>
							<span className='font-medium text-slate-700'>{prov.label}</span>
						</div>
						<div className='flex items-center gap-2'>
							<span className='text-slate-400 text-xs'>
								{prov.count} patient{prov.count !== 1 ? "s" : ""}
							</span>
							<div className='h-1.5 w-10 overflow-hidden rounded-full bg-slate-100'>
								<div
									className='h-1.5 rounded-full transition-all duration-500'
									style={{
										width: `${(prov.count / maxCount) * 100}%`,
										backgroundColor: prov.color,
									}}
								/>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
