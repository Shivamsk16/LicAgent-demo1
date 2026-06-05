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
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils/currency";
import { CHART_COLORS } from "@/components/charts/chart-colors";
import type { ReportId } from "@/lib/reports/types";
import { useTenantStore } from "@/store/tenant";
import { Download, Printer } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Alert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ReportViewer({ reportId }: { reportId: ReportId }) {
  const isManager = useTenantStore((s) => s.isManager);
  const role = useTenantStore((s) => s.role);
  const canExport = isManager || role === "senior_agent";

  const defaultFrom = format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd");
  const defaultTo = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [fy, setFy] = useState("");
  const [rowSearch, setRowSearch] = useState("");
  const [rowPage, setRowPage] = useState(1);
  const ROW_PAGE_SIZE = 25;
  const debouncedRowSearch = useDebouncedValue(rowSearch);

  const qs = useMemo(() => {
    const p = new URLSearchParams({ from, to });
    if (fy) p.set("fy", fy);
    return p.toString();
  }, [from, to, fy]);

  const { data, isLoading, isError, error, refetch } = useQuery({
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
  const allRows = (data?.rows ?? []) as Record<string, unknown>[];

  const filteredRows = useMemo(() => {
    if (!debouncedRowSearch.trim()) return allRows;
    const q = debouncedRowSearch.toLowerCase();
    return allRows.filter((row) =>
      Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [allRows, debouncedRowSearch]);

  const rowTotal = filteredRows.length;
  const rows = filteredRows.slice(
    (rowPage - 1) * ROW_PAGE_SIZE,
    rowPage * ROW_PAGE_SIZE
  );

  function exportCSV() {
    window.open(`/api/reports/${reportId}/export?${qs}`, "_blank");
  }

  return (
    <div className="report-print section-gap">
      <PageHeader
        title={meta?.name ?? "Report"}
        description={meta?.description}
        backHref="/dashboard/reports"
        backLabel="All reports"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reports", href: "/dashboard/reports" },
          { label: meta?.name ?? "Report" },
        ]}
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

      <div className="filter-bar print:hidden">
        <label className="flex items-center gap-2 text-xs text-lic-neutral-500">
          From
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[160px]"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-lic-neutral-500">
          To
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-[160px]"
          />
        </label>
        {reportId === "financial-year-summary" && (
          <label className="flex items-center gap-2 text-xs text-lic-neutral-500">
            FY
            <Input
              type="text"
              placeholder="2025-26"
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              className="w-28"
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
      {isError && (
        <Alert variant="error" title="Could not load report">
          {error instanceof Error ? error.message : "Something went wrong."}
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs font-medium underline"
          >
            Try again
          </button>
        </Alert>
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
                  className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]"
                >
                  <p className="text-[13px] text-lic-neutral-500">
                    {k.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-lic-neutral-900">
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

          {allRows.length > 0 && (
            <TableContainer
              title={`${rowTotal} row${rowTotal === 1 ? "" : "s"}`}
              actions={
                <Input
                  placeholder="Search rows…"
                  value={rowSearch}
                  onChange={(e) => { setRowSearch(e.target.value); setRowPage(1); }}
                  className="h-8 w-48 text-xs"
                />
              }
            >
              <Table dense>
                <TableHeader sticky>
                  <TableRow>
                    {Object.keys(allRows[0] as object).map((h, i) => (
                      <TableHead key={h} sticky={i === 0}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <td colSpan={Object.keys(allRows[0] as object).length} className="px-4 py-8 text-center text-sm text-lic-neutral-500">
                        No rows match your search.
                      </td>
                    </TableRow>
                  ) : (
                    rows.map((row, i) => (
                      <TableRow key={i} interactive>
                        {Object.entries(row).map(([key, val], j) => (
                          <TableCell key={key} sticky={j === 0} truncate={j === 0}>
                            {typeof val === "number" && key.toLowerCase().includes("amount")
                              ? formatINR(val)
                              : String(val ?? "—")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination page={rowPage} pageSize={ROW_PAGE_SIZE} total={rowTotal} onPageChange={setRowPage} />
            </TableContainer>
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
