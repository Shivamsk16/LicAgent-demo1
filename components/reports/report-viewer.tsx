"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils/currency";
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

const ReportChart = dynamic(
  () => import("./report-chart").then((m) => ({ default: m.ReportChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

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
  const allRows = useMemo(
    () => (data?.rows ?? []) as Record<string, unknown>[],
    [data?.rows]
  );

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
