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
import type { ReportId } from "@/lib/reports/types";

export function ReportChart({
  chartType,
  chartData,
  reportId,
}: {
  chartType: string;
  chartData: Record<string, unknown>[];
  reportId: ReportId;
}) {
  if (!chartData.length || chartType === "table" || chartType === "timeline") {
    return null;
  }

  if (chartType === "donut") {
    return (
      <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06] print:break-inside-avoid">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "line" || reportId === "collection-efficiency") {
    return (
      <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            {reportId === "collection-efficiency" ? (
              <>
                <Line type="monotone" dataKey="onTime" stroke={CHART_COLORS.accent} name="On time" />
                <Line type="monotone" dataKey="late" stroke={CHART_COLORS.missed} name="Late" />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.primary}
                name="Count"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "horizontalBar" || reportId === "agent-performance") {
    return (
      <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]">
        <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 36)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
            <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="agent" width={75} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => formatINR(Number(v))} />
            <Bar dataKey="value" fill={CHART_COLORS.collected} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (reportId === "commission-summary") {
    return (
      <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
            <XAxis dataKey="agent" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatINR(Number(v))} />
            <Legend />
            <Bar dataKey="gross" fill={CHART_COLORS.expected} name="Gross" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" fill={CHART_COLORS.collected} name="Net" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === "summary" || reportId === "financial-year-summary") {
    return (
      <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatINR(Number(v))} />
            <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatINR(Number(v))} />
          <Legend />
          <Bar dataKey="collected" fill={CHART_COLORS.collected} name="Collected" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expected" fill={CHART_COLORS.expected} name="Expected" radius={[4, 4, 0, 0]} />
          <Bar dataKey="missed" fill={CHART_COLORS.missed} name="Missed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
