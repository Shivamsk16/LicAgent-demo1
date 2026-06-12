"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

const CommissionCharts = dynamic(
  () =>
    import("./commission-charts").then((m) => ({ default: m.CommissionCharts })),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-black/[0.04]" /> }
);
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { format } from "date-fns";
import { useTenantStore } from "@/store/tenant";
import type { CommissionRow } from "@/lib/commission/queries";
import { Download, Printer, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatGridSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useSort } from "@/lib/hooks/use-sort";
import type { PaginatedResult } from "@/lib/api/list-params";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const POLICY_TYPES = [
  "all",
  "endowment",
  "whole_life",
  "term",
  "money_back",
  "ulip",
  "pension",
  "child",
];

const PAGE_SIZE = 25;

export function CommissionDashboard() {
  const isManager = useTenantStore((s) => s.isManager);
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [fy, setFy] = useState("");
  const [commissionType, setCommissionType] = useState("all");
  const [policyType, setPolicyType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentId, setAgentId] = useState(searchParams.get("agent_id") ?? "");
  const [page, setPage] = useState(1);
  const { sort, order, toggleSort } = useSort("created_at", "desc");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(PAGE_SIZE));
    p.set("sort", sort);
    p.set("order", order);
    if (month) p.set("month", month);
    if (fy) p.set("fy", fy);
    if (commissionType !== "all") p.set("commission_type", commissionType);
    if (policyType !== "all") p.set("policy_type", policyType);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (agentId) p.set("agent_id", agentId);
    return p.toString();
  }, [month, fy, commissionType, policyType, statusFilter, agentId, page, sort, order]);

  const { data: agentsData } = useQuery({
    queryKey: ["commission-agents"],
    queryFn: async () => {
      const res = await fetch("/api/commissions/agents");
      const json = await res.json();
      if (!json.success) return { agents: [] };
      return json.data as { agents: { id: string; full_name: string }[] };
    },
    enabled: isManager,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["commissions", qs],
    queryFn: async () => {
      const res = await fetch(`/api/commissions?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as {
        summary: {
          grossMonth: number;
          netMonth: number;
          fyTotal: number;
          pending: number;
        };
        commissions: PaginatedResult<CommissionRow>;
        charts: {
          monthlyByAgent: Record<string, string | number>[];
          typeSplit: { name: string; value: number }[];
          trendLine: { month: string; net: number }[];
        };
      };
    },
  });

  function exportCSV() {
    window.open(`/api/commissions?${qs}&format=csv`, "_blank");
  }

  function printPDF() {
    window.print();
  }

  const agentKeys = useMemo(() => {
    if (!data?.charts.monthlyByAgent?.length) return [];
    const keys = new Set<string>();
    for (const row of data.charts.monthlyByAgent) {
      for (const k of Object.keys(row)) {
        if (k !== "month") keys.add(k);
      }
    }
    return Array.from(keys);
  }, [data?.charts.monthlyByAgent]);

  const commissions = data?.commissions?.items ?? [];
  const commissionTotal = data?.commissions?.total ?? 0;

  return (
    <div className="commission-print section-gap">
      <PageHeader
        title="Commissions"
        description="Track gross and net commission by month, agent, and policy type."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Commissions" },
        ]}
        actions={
          <div className="flex gap-2 print:hidden">
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <Download className="mr-1 h-4 w-4" />
              CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={printPDF}>
              <Printer className="mr-1 h-4 w-4" />
              Print / PDF
            </Button>
          </div>
        }
      />

      <div className="hidden print:block mb-4">
        <h1 className="text-lg font-semibold">Commission report</h1>
        <p className="text-sm text-lic-neutral-500">
          Month: {month} · Generated {format(new Date(), "dd MMM yyyy HH:mm")}
        </p>
      </div>

      <div className="filter-bar print:hidden">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-[160px]"
          aria-label="Month"
        />
        <Input
          type="text"
          placeholder="FY e.g. 2025-26"
          value={fy}
          onChange={(e) => setFy(e.target.value)}
          className="w-32"
        />
        <Select
          value={commissionType}
          onChange={(e) => setCommissionType(e.target.value)}
          containerClassName="w-[140px]"
        >
          <option value="all">All types</option>
          <option value="first_year">First year</option>
          <option value="renewal">Renewal</option>
          <option value="bonus">Bonus</option>
        </Select>
        <Select
          value={policyType}
          onChange={(e) => setPolicyType(e.target.value)}
          containerClassName="w-[160px]"
        >
          {POLICY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All plan types" : t.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} containerClassName="w-[140px]">
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </Select>
        {isManager && (
          <Select
            value={agentId}
            onChange={(e) => { setAgentId(e.target.value); setPage(1); }}
            containerClassName="w-[160px]"
          >
            <option value="">All agents</option>
            {(agentsData?.agents ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {isLoading ? (
        <>
          <StatGridSkeleton count={4} />
          <TableSkeleton rows={8} cols={11} />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Gross (month)"
              value={formatINR(data?.summary.grossMonth ?? 0)}
              accent="yellow"
            />
            <StatCard
              label="Net after GST"
              value={formatINR(data?.summary.netMonth ?? 0)}
              accent="green"
            />
            <StatCard
              label="FY total (net)"
              value={formatINR(data?.summary.fyTotal ?? 0)}
              accent="blue"
            />
            <StatCard
              label="Pending"
              value={formatINR(data?.summary.pending ?? 0)}
              accent="amber"
            />
          </div>

          {isManager && data?.charts && (
            <CommissionCharts agentKeys={agentKeys} charts={data.charts} />
          )}

          <TableContainer title={`${commissionTotal} commission${commissionTotal === 1 ? "" : "s"}`}>
            <Table dense>
              <TableHeader sticky>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <SortableTableHead label="Month" column="month" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} sticky />
                  <TableHead hideOnMobile className="hidden md:table-cell">Customer</TableHead>
                  <TableHead hideOnMobile className="hidden lg:table-cell">Policy #</TableHead>
                  <TableHead hideOnMobile className="hidden lg:table-cell">Plan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead hideOnMobile className="hidden md:table-cell" align="right">Premium</TableHead>
                  <TableHead hideOnMobile className="hidden lg:table-cell">Rate</TableHead>
                  <TableHead hideOnMobile className="hidden md:table-cell" align="right">Gross</TableHead>
                  <TableHead hideOnMobile className="hidden lg:table-cell" align="right">GST</TableHead>
                  <SortableTableHead label="Net" column="net_commission" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} align="right" />
                  <SortableTableHead label="Status" column="status" activeSort={sort} activeOrder={order} onSort={(c) => { toggleSort(c); setPage(1); }} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 && (
                  <TableRow>
                    <td colSpan={12} className="p-0">
                      <EmptyState
                        icon={IndianRupee}
                        title="No commission yet"
                        description="Record a payment to generate commission entries."
                        actionLabel="Record payment"
                        actionHref="/dashboard/payments/record"
                        className="border-0"
                      />
                    </td>
                  </TableRow>
                )}
                {commissions.map((r, index) => (
                  <TableRow key={r.id} interactive>
                    <TableCell mono className="w-12 text-lic-neutral-500">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell mono sticky>{r.month}</TableCell>
                    <TableCell primary hideOnMobile className="hidden md:table-cell truncate">{r.policy?.customer?.full_name ?? "—"}</TableCell>
                    <TableCell mono hideOnMobile className="hidden lg:table-cell">{r.policy?.policy_number ?? "—"}</TableCell>
                    <TableCell hideOnMobile className="hidden lg:table-cell truncate">{r.policy?.plan_name ?? "—"}</TableCell>
                    <TableCell><Badge>{r.commission_type}</Badge></TableCell>
                    <TableCell mono align="right" hideOnMobile className="hidden md:table-cell">{formatINR(Number(r.premium_amount))}</TableCell>
                    <TableCell hideOnMobile className="hidden lg:table-cell">{r.commission_rate}%</TableCell>
                    <TableCell mono align="right" hideOnMobile className="hidden md:table-cell">{formatINR(Number(r.commission_amount))}</TableCell>
                    <TableCell mono align="right" hideOnMobile className="hidden lg:table-cell">{formatINR(Number(r.gst_amount))}</TableCell>
                    <TableCell mono align="right" primary>{formatINR(Number(r.net_commission))}</TableCell>
                    <TableCell><Badge variant={r.status === "paid" ? "active" : "trial"}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={commissionTotal} onPageChange={setPage} />
          </TableContainer>
        </>
      )}
    </div>
  );
}
