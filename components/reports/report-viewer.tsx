"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils/currency";
import { CHART_COLORS } from "@/components/charts/chart-colors";
import type { ReportId } from "@/lib/reports/types";
import { useTenantStore } from "@/store/tenant";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export function ReportViewer({ reportId }: { reportId: ReportId }) {
  const isManager = useTenantStore((s) => s.isManager);
  const role = useTenantStore((s) => s.role);
  const canExport = isManager || role === "senior_agent";

  const defaultFrom = format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd");
  const defaultTo = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [fy, setFy] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams({ from, to });
    if (fy) p.set("fy", fy);
    return p.toString();
  }, [from, to, fy]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["report", reportId, qs],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${reportId}?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });

  const meta = data?.meta;
  const chartData = data?.chartData ?? [];
  const rows = data?.rows ?? [];

  function exportCSV() {
    window.open(`/api/reports/${reportId}/export?${qs}`, "_blank");
  }

  return (
    <div className="report-print space-y-6">
      <div className="print:hidden">
        <Link
          href="/dashboard/reports"
          className="mb-2 inline-flex items-center gap-1 text-sm text-lic-neutral-500 hover:text-lic-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          All reports
        </Link>
      </div>

      <PageHeader
        title={meta?.name ?? "Report"}
        description={meta?.description}
        actions={
          <div className="flex gap-2 print:hidden">
            {canExport && (
              <Button variant="secondary" size="sm" onClick={exportCSV}>
                <Download className="mr-1 h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1 h-4 w-4" />
              Print / PDF
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 print:hidden">
        <label className="text-xs text-lic-neutral-500">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="ml-1 h-9 rounded-btn border px-2 text-sm"
          />
        </label>
        <label className="text-xs text-lic-neutral-500">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="ml-1 h-9 rounded-btn border px-2 text-sm"
          />
        </label>
        {reportId === "financial-year-summary" && (
          <label className="text-xs text-lic-neutral-500">
            FY
            <input
              type="text"
              placeholder="2025-26"
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              className="ml-1 h-9 w-28 rounded-btn border px-2 text-sm"
            />
          </label>
        )}
      </div>

      {isLoading && (
        <>
          <ChartSkeleton />
          <TableSkeleton rows={6} cols={4} />
        </>
      )}
      {error && (
        <p className="text-sm text-lic-red-600">{(error as Error).message}</p>
      )}

      {data && (
        <>
          <ReportChart
            chartType={meta?.chartType ?? "table"}
            chartData={chartData as Record<string, unknown>[]}
            reportId={reportId}
          />

          {data.summary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.summary).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-card border bg-white p-4 shadow-card"
                >
                  <p className="text-xs uppercase text-lic-neutral-500">
                    {k.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {typeof v === "number" && k.toLowerCase().includes("commission")
                      ? formatINR(v)
                      : typeof v === "number" && k.toLowerCase().includes("premium")
                        ? formatINR(v)
                        : String(v)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-card border bg-white shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-lic-blue-50">
                    {Object.keys(rows[0] as object).map((h) => (
                      <th
                        key={h}
                        className="px-2 py-2 text-left text-xs uppercase text-lic-neutral-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(rows as Record<string, unknown>[]).map((row, i) => (
                    <tr key={i} className="border-b">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-2">
                          {typeof val === "number" &&
                          String(Object.keys(row)[j]).toLowerCase().includes("amount")
                            ? formatINR(val)
                            : String(val ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportChart({
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
      <div className="rounded-card border bg-white p-4 shadow-card print:break-inside-avoid">
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
      <div className="rounded-card border bg-white p-4 shadow-card">
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
      <div className="rounded-card border bg-white p-4 shadow-card">
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
      <div className="rounded-card border bg-white p-4 shadow-card">
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
      <div className="rounded-card border bg-white p-4 shadow-card">
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
    <div className="rounded-card border bg-white p-4 shadow-card">
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
