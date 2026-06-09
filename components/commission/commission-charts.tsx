"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/components/charts/chart-colors";
import { formatINR } from "@/lib/utils/currency";

export function CommissionCharts({
  agentKeys,
  charts,
}: {
  agentKeys: string[];
  charts: {
    monthlyByAgent: Record<string, string | number>[];
    typeSplit: { name: string; value: number }[];
    trendLine: { month: string; net: number }[];
  };
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 print:hidden">
      {agentKeys.length > 0 && (
        <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]">
          <h3 className="mb-3 text-sm font-semibold">
            Commission by agent (6 months)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.monthlyByAgent}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatINR(Number(v))} />
              <Legend />
              {agentKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]">
        <h3 className="mb-3 text-sm font-semibold">By commission type</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={charts.typeSplit}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {charts.typeSplit.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatINR(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06] lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold">12-month trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={charts.trendLine}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatINR(Number(v))} />
            <Line
              type="monotone"
              dataKey="net"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
              name="Net commission"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
