"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ConsentChartProps {
	data: {
		consented: number;
		not_consented: number;
		total: number;
	};
}

const COLORS = ["#16A34A", "#DC2626"];

export function ConsentChart({ data }: ConsentChartProps) {
	const chartData = [
		{ name: "Consented", value: data.consented },
		{ name: "Not Consented", value: data.not_consented },
	];

	if (data.total === 0) {
		return <div className='flex h-64 items-center justify-center text-sm text-slate-500'>No image data yet</div>;
	}

	const consentRate = ((data.consented / data.total) * 100).toFixed(1);

	return (
		<div className='space-y-4'>
			<div className='text-center'>
				<p className='text-3xl font-bold text-slate-900'>{consentRate}%</p>
				<p className='text-sm text-slate-600'>Consent Rate</p>
			</div>
			<ResponsiveContainer
				width='100%'
				height={220}
			>
				<PieChart>
					<Pie
						data={chartData}
						cx='50%'
						cy='50%'
						labelLine={false}
						label={({ name, value }) => `${name}: ${value}`}
						outerRadius={80}
						fill='#8884d8'
						dataKey='value'
					>
						{chartData.map((_, index) => (
							<Cell
								key={`cell-${index}`}
								fill={COLORS[index % COLORS.length]}
							/>
						))}
					</Pie>
					<Tooltip />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
