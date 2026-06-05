import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardContext } from "@/lib/auth/dashboard-context";
import { getFinancialYear } from "@/lib/business/payments";
import { format, subMonths } from "date-fns";
import {
  applySort,
  paginated,
  parseListParams,
  type FilterableQuery,
  type PaginatedResult,
  type SortOrder,
} from "@/lib/api/list-params";

export interface CommissionRow {
  id: string;
  month: string;
  commission_type: string;
  premium_amount: number;
  commission_rate: number;
  commission_amount: number;
  gst_amount: number;
  net_commission: number;
  financial_year: string;
  status: string;
  created_at: string;
  agent_id: string;
  policy_id: string;
  policy?: {
    policy_number: string;
    plan_name: string;
    policy_type: string;
    customer?: { full_name: string };
  };
  agent?: { full_name: string };
}

export interface CommissionSummary {
  grossMonth: number;
  netMonth: number;
  fyTotal: number;
  pending: number;
}

export async function getCommissionSummary(
  ctx: DashboardContext,
  filters: { month?: string; agentId?: string; fy?: string }
): Promise<CommissionSummary> {
  const admin = createAdminClient();
  const month = filters.month ?? format(new Date(), "yyyy-MM");
  const fy = filters.fy ?? getFinancialYear(new Date());

  const base = () => {
    let q = admin
      .from("commissions")
      .select("commission_amount, net_commission, status")
      .eq("tenant_id", ctx.tenantId);
    if (!ctx.isManager) q = q.eq("agent_id", ctx.userId);
    else if (filters.agentId) q = q.eq("agent_id", filters.agentId);
    return q;
  };

  const { data: monthRows } = await base().eq("month", month);

  const { data: fyRows } = await base().eq("financial_year", fy);

  const grossMonth = (monthRows ?? []).reduce(
    (s, r) => s + Number(r.commission_amount),
    0
  );
  const netMonth = (monthRows ?? []).reduce(
    (s, r) => s + Number(r.net_commission),
    0
  );
  const fyTotal = (fyRows ?? []).reduce(
    (s, r) => s + Number(r.net_commission),
    0
  );
  const pending = (monthRows ?? [])
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + Number(r.net_commission), 0);

  return { grossMonth, netMonth, fyTotal, pending };
}

const COMMISSION_SORT = {
  created_at: "created_at",
  net_commission: "net_commission",
  month: "month",
  status: "status",
};

function applyCommissionFilters(
  query: FilterableQuery,
  ctx: DashboardContext,
  filters: {
    month?: string;
    fy?: string;
    commissionType?: string;
    policyType?: string;
    agentId?: string;
    status?: string;
  }
): FilterableQuery {
  if (!ctx.isManager) query = query.eq("agent_id", ctx.userId);
  else if (filters.agentId) query = query.eq("agent_id", filters.agentId);
  if (filters.month) query = query.eq("month", filters.month);
  if (filters.fy) query = query.eq("financial_year", filters.fy);
  if (filters.commissionType && filters.commissionType !== "all") {
    query = query.eq("commission_type", filters.commissionType);
  }
  if (filters.policyType && filters.policyType !== "all") {
    query = query.eq("policy_type", filters.policyType);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  return query;
}

export async function listCommissions(
  ctx: DashboardContext,
  filters: {
    month?: string;
    fy?: string;
    commissionType?: string;
    policyType?: string;
    agentId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    order?: SortOrder;
    limit?: number;
  }
): Promise<PaginatedResult<CommissionRow> | CommissionRow[]> {
  const admin = createAdminClient();
  const isPaginated = filters.page !== undefined || filters.pageSize !== undefined;

  if (!isPaginated && filters.limit) {
    let query = admin
      .from("commissions")
      .select(
        `*, policy:policies(policy_number, plan_name, policy_type, customer:customers(full_name)),
         agent:users!agent_id(full_name)`
      )
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false });
    query = applyCommissionFilters(query, ctx, filters);
    query = query.limit(filters.limit);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as CommissionRow[];
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const offset = (page - 1) * pageSize;
  const order = filters.order ?? "desc";

  let dataQuery = admin
    .from("commissions")
    .select(
      `*, policy:policies(policy_number, plan_name, policy_type, customer:customers(full_name)),
       agent:users!agent_id(full_name)`,
      { count: "exact" }
    )
    .eq("tenant_id", ctx.tenantId);
  dataQuery = applyCommissionFilters(dataQuery, ctx, filters);
  dataQuery = applySort(dataQuery, filters.sort, order, COMMISSION_SORT);
  dataQuery = dataQuery.range(offset, offset + pageSize - 1);

  const { data, error, count } = await dataQuery;
  if (error) throw new Error(error.message);
  return paginated((data ?? []) as CommissionRow[], count ?? 0, page, pageSize);
}

export async function getCommissionChartData(ctx: DashboardContext) {
  const admin = createAdminClient();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(format(subMonths(new Date(), i), "yyyy-MM"));
  }

  let query = admin
    .from("commissions")
    .select("month, agent_id, commission_type, net_commission, agent:users!agent_id(full_name)")
    .eq("tenant_id", ctx.tenantId)
    .in("month", months);

  if (!ctx.isManager) query = query.eq("agent_id", ctx.userId);
  const { data } = await query;

  const byType = new Map<string, number>();

  for (const row of data ?? []) {
    const net = Number(row.net_commission);
    const type = row.commission_type as string;
    byType.set(type, (byType.get(type) ?? 0) + net);
  }

  const monthlyByAgent = months.map((month) => {
    const agentTotals: Record<string, number> = {};
    for (const row of data ?? []) {
      if (row.month !== month) continue;
      const agentRaw = row.agent as { full_name: string } | { full_name: string }[] | null;
      const agentName = Array.isArray(agentRaw)
        ? agentRaw[0]?.full_name
        : agentRaw?.full_name ?? "Unknown";
      agentTotals[agentName] =
        (agentTotals[agentName] ?? 0) + Number(row.net_commission);
    }
    return { month, ...agentTotals };
  });

  const typeSplit = Array.from(byType.entries()).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));

  const last12: string[] = [];
  for (let i = 11; i >= 0; i--) {
    last12.push(format(subMonths(new Date(), i), "yyyy-MM"));
  }

  let trend12Q = admin
    .from("commissions")
    .select("month, net_commission")
    .eq("tenant_id", ctx.tenantId)
    .in("month", last12);
  if (!ctx.isManager) trend12Q = trend12Q.eq("agent_id", ctx.userId);
  const { data: trend12Data } = await trend12Q;

  const trend12Map = new Map(last12.map((m) => [m, 0]));
  for (const row of trend12Data ?? []) {
    trend12Map.set(
      row.month as string,
      (trend12Map.get(row.month as string) ?? 0) + Number(row.net_commission)
    );
  }
  const trend12 = last12.map((month) => ({
    month,
    net: trend12Map.get(month) ?? 0,
  }));

  return { monthlyByAgent, typeSplit, trendLine: trend12 };
}

export async function listTenantAgents(tenantId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_members")
    .select("user_id, users(id, full_name, email)")
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  return (data ?? []).map((m) => {
    const u = m.users as { id: string; full_name: string; email: string } | { id: string; full_name: string; email: string }[] | null;
    const user = Array.isArray(u) ? u[0] : u;
    return {
      id: user?.id ?? m.user_id,
      full_name: user?.full_name ?? "—",
      email: user?.email ?? "",
    };
  });
}

export function commissionsToCSV(rows: CommissionRow[]) {
  const headers = [
    "Month",
    "Customer",
    "Policy #",
    "Plan",
    "Type",
    "Premium",
    "Rate %",
    "Gross",
    "GST",
    "Net",
    "Status",
  ];
  const lines = rows.map((r) => [
    r.month,
    r.policy?.customer?.full_name ?? "",
    r.policy?.policy_number ?? "",
    r.policy?.plan_name ?? "",
    r.commission_type,
    r.premium_amount,
    r.commission_rate,
    r.commission_amount,
    r.gst_amount,
    r.net_commission,
    r.status,
  ]);
  return [headers, ...lines]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}
