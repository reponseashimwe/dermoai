"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface OutcomeChartProps {
  data: Array<{
    disposition: string;
    total: number;
    verified: number;
    got_treatment: number;
  }>;
}

const DISPOSITION_LABELS: Record<string, string> = {
  TREATED_LOCALLY: "Treated Locally",
  TELEMEDICINE_ONLY: "Telemedicine",
  REFERRED_TO_CLINIC: "Referred",
};

export function OutcomeChart({ data }: OutcomeChartProps) {
  const chartData = data.map((item) => ({
    name: DISPOSITION_LABELS[item.disposition] ?? item.disposition,
    Total: item.total,
    Verified: item.verified,
    "Got Treatment": item.got_treatment,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No outcome data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="Total" fill="#94A3B8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Got Treatment" fill="#078ece" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Verified" fill="#16A34A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
