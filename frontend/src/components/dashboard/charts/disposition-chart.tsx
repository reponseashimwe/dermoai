"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DispositionChartProps {
  data: {
    treated_locally: number;
    telemedicine_only: number;
    referred_to_clinic: number;
    not_set: number;
  };
}

const COLORS: Record<string, string> = {
  treated_locally: "#16A34A",
  telemedicine_only: "#078ece",
  referred_to_clinic: "#F59E0B",
  not_set: "#94A3B8",
};

export function DispositionChart({ data }: DispositionChartProps) {
  const chartData = [
    { name: "Treated Locally", value: data.treated_locally, key: "treated_locally" },
    { name: "Telemedicine Only", value: data.telemedicine_only, key: "telemedicine_only" },
    { name: "Referred to Clinic", value: data.referred_to_clinic, key: "referred_to_clinic" },
    { name: "Not Set", value: data.not_set, key: "not_set" },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No disposition data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#64748B" }}
          angle={-15}
          textAnchor="end"
          height={60}
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
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
