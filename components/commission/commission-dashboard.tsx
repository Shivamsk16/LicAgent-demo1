"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { format } from "date-fns";
import { CHART_COLORS } from "@/components/charts/chart-colors";
import { useTenantStore } from "@/store/tenant";
import type { CommissionRow } from "@/lib/commission/queries";
import { Download, Printer, IndianRupee } from "lucide-react";
import { StatGridSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

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

export function CommissionDashboard() {
  const isManager = useTenantStore((s) => s.isManager);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [fy, setFy] = useState("");
  const [commissionType, setCommissionType] = useState("all");
  const [policyType, setPolicyType] = useState("all");
  const [agentId, setAgentId] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (month) p.set("month", month);
    if (fy) p.set("fy", fy);
    if (commissionType !== "all") p.set("commission_type", commissionType);
    if (policyType !== "all") p.set("policy_type", policyType);
    if (agentId) p.set("agent_id", agentId);
    return p.toString();
  }, [month, fy, commissionType, policyType, agentId]);

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
        commissions: CommissionRow[];
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

  const commissions = data?.commissions ?? [];

  return (
    <div className="commission-print space-y-6">
      <PageHeader
        title="Commission earnings"
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

      <div className="flex flex-wrap gap-3 print:hidden">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-btn border px-2 text-sm"
        />
        <input
          type="text"
          placeholder="FY e.g. 2025-26"
          value={fy}
          onChange={(e) => setFy(e.target.value)}
          className="h-9 w-32 rounded-btn border px-2 text-sm"
        />
        <select
          value={commissionType}
          onChange={(e) => setCommissionType(e.target.value)}
          className="h-9 rounded-btn border px-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="first_year">First year</option>
          <option value="renewal">Renewal</option>
          <option value="bonus">Bonus</option>
        </select>
        <select
          value={policyType}
          onChange={(e) => setPolicyType(e.target.value)}
          className="h-9 rounded-btn border px-2 text-sm"
        >
          {POLICY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All plan types" : t.replace("_", " ")}
            </option>
          ))}
        </select>
        {isManager && (
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="h-9 rounded-btn border px-2 text-sm"
          >
            <option value="">All agents</option>
            {(agentsData?.agents ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
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
            <div className="grid gap-6 lg:grid-cols-2 print:hidden">
              {agentKeys.length > 0 && (
                <div className="rounded-card border bg-white p-4 shadow-card">
                  <h3 className="mb-3 text-sm font-semibold">
                    Commission by agent (6 months)
                  </h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.charts.monthlyByAgent}>
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
              <div className="rounded-card border bg-white p-4 shadow-card">
                <h3 className="mb-3 text-sm font-semibold">By commission type</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.charts.typeSplit}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {data.charts.typeSplit.map((_, i) => (
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
              <div className="rounded-card border bg-white p-4 shadow-card lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold">12-month trend</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.charts.trendLine}>
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
          )}

          <div className="overflow-x-auto rounded-card border bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-lic-blue-50">
                  {[
                    "Month",
                    "Customer",
                    "Policy #",
                    "Plan",
                    "Type",
                    "Premium",
                    "Rate",
                    "Gross",
                    "GST",
                    "Net",
                    "Status",
                  ].map((h) => (
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
                {commissions.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-0">
                      <EmptyState
                        icon={IndianRupee}
                        title="No commission yet"
                        description="Record a payment to generate commission entries."
                        actionLabel="Record payment"
                        actionHref="/dashboard/payments/record"
                        className="border-0"
                      />
                    </td>
                  </tr>
                )}
                {commissions.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-2 py-2">{r.month}</td>
                    <td className="px-2 py-2">
                      {r.policy?.customer?.full_name ?? "—"}
                    </td>
                    <td className="px-2 py-2">{r.policy?.policy_number ?? "—"}</td>
                    <td className="px-2 py-2">{r.policy?.plan_name ?? "—"}</td>
                    <td className="px-2 py-2">
                      <Badge>{r.commission_type}</Badge>
                    </td>
                    <td className="px-2 py-2">{formatINR(Number(r.premium_amount))}</td>
                    <td className="px-2 py-2">{r.commission_rate}%</td>
                    <td className="px-2 py-2">
                      {formatINR(Number(r.commission_amount))}
                    </td>
                    <td className="px-2 py-2">{formatINR(Number(r.gst_amount))}</td>
                    <td className="px-2 py-2 font-medium">
                      {formatINR(Number(r.net_commission))}
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant={r.status === "paid" ? "active" : "trial"}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
