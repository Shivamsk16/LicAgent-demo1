import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardContext } from "@/lib/auth/dashboard-context";
import { getFinancialYear } from "@/lib/business/payments";
import {
  REPORT_CATALOG,
  type ReportId,
  type ReportResult,
} from "@/lib/reports/types";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  addMonths,
  parseISO,
  differenceInDays,
} from "date-fns";

function defaultRange() {
  const to = endOfMonth(new Date());
  const from = startOfMonth(subMonths(new Date(), 5));
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

function policyAgentFilter(ctx: DashboardContext) {
  return ctx.isManager ? {} : { agent_id: ctx.userId };
}

function customerAgentFilter(ctx: DashboardContext) {
  return ctx.isManager ? {} : { assigned_agent_id: ctx.userId };
}

export async function generateReport(
  reportId: ReportId,
  ctx: DashboardContext,
  params: { from?: string; to?: string; fy?: string }
): Promise<ReportResult | { error: string }> {
  const meta = REPORT_CATALOG.find((r) => r.id === reportId);
  if (!meta) return { error: "Unknown report" };
  if (meta.managerOnly && !ctx.isManager) {
    return { error: "Manager access required" };
  }

  const range = defaultRange();
  const from = params.from ?? range.from;
  const to = params.to ?? range.to;
  const admin = createAdminClient();
  const tenantId = ctx.tenantId;
  const pFilter = policyAgentFilter(ctx);
  const cFilter = customerAgentFilter(ctx);

  switch (reportId) {
    case "monthly-premium-collection": {
      const months: string[] = [];
      let cur = startOfMonth(parseISO(from));
      const end = parseISO(to);
      while (cur <= end) {
        months.push(format(cur, "yyyy-MM"));
        cur = addMonths(cur, 1);
      }

      let payQ = admin
        .from("payments")
        .select("payment_date, amount_paid, amount_due, status, due_date")
        .eq("tenant_id", tenantId)
        .gte("payment_date", from)
        .lte("payment_date", to);
      if (!ctx.isManager) {
        const { data: policyIds } = await admin
          .from("policies")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("agent_id", ctx.userId);
        const ids = (policyIds ?? []).map((p) => p.id);
        if (!ids.length) {
          return {
            meta,
            from,
            to,
            rows: [],
            chartData: months.map((m) => ({
              month: m,
              collected: 0,
              expected: 0,
              missed: 0,
            })),
          };
        }
        payQ = payQ.in("policy_id", ids);
      }
      const { data: payments } = await payQ;

      const { data: policies } = await admin
        .from("policies")
        .select("next_premium_due, premium_amount, status")
        .eq("tenant_id", tenantId)
        .match(pFilter);

      const chartData = months.map((month) => {
        const collected = (payments ?? [])
          .filter(
            (p) =>
              p.status === "paid" &&
              (p.payment_date as string).startsWith(month)
          )
          .reduce((s, p) => s + Number(p.amount_paid), 0);

        const expected = (policies ?? [])
          .filter(
            (p) =>
              p.next_premium_due &&
              (p.next_premium_due as string).startsWith(month) &&
              p.status === "in_force"
          )
          .reduce((s, p) => s + Number(p.premium_amount), 0);

        return {
          month,
          collected: Math.round(collected),
          expected: Math.round(expected),
          missed: Math.max(0, Math.round(expected - collected)),
        };
      });

      return { meta, from, to, rows: chartData, chartData };
    }

    case "agent-performance": {
      const { data: members } = await admin
        .from("tenant_members")
        .select("user_id, users(full_name)")
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      const rows: Record<string, unknown>[] = [];
      for (const m of members ?? []) {
        const u = m.users as { full_name: string } | { full_name: string }[] | null;
        const name = Array.isArray(u) ? u[0]?.full_name : u?.full_name;
        const uid = m.user_id;

        const { count: customers } = await admin
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("assigned_agent_id", uid);

        const { count: policies } = await admin
          .from("policies")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("agent_id", uid)
          .eq("status", "in_force");

        const { data: agentPolicies } = await admin
          .from("policies")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("agent_id", uid);
        const policyIds = (agentPolicies ?? []).map((p) => p.id);
        let collected = 0;
        if (policyIds.length) {
          const { data: pays } = await admin
            .from("payments")
            .select("amount_paid")
            .eq("tenant_id", tenantId)
            .in("policy_id", policyIds)
            .gte("payment_date", from)
            .lte("payment_date", to)
            .eq("status", "paid");
          collected = (pays ?? []).reduce(
            (s, p) => s + Number(p.amount_paid),
            0
          );
        }

        const monthKey = format(new Date(), "yyyy-MM");
        const { data: comm } = await admin
          .from("commissions")
          .select("net_commission")
          .eq("tenant_id", tenantId)
          .eq("agent_id", uid)
          .eq("month", monthKey);

        rows.push({
          agent: name ?? uid,
          customers: customers ?? 0,
          activePolicies: policies ?? 0,
          premiumsCollected: collected,
          commissionMonth: (comm ?? []).reduce(
            (s, c) => s + Number(c.net_commission),
            0
          ),
        });
      }

      const chartData = rows.map((r) => ({
        agent: r.agent as string,
        value: r.premiumsCollected as number,
      }));

      return { meta, from, to, rows, chartData };
    }

    case "policy-status-breakdown": {
      const { data } = await admin
        .from("policies")
        .select("status")
        .eq("tenant_id", tenantId)
        .match(pFilter);
      const counts = new Map<string, number>();
      for (const p of data ?? []) {
        const s = p.status as string;
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
      const chartData = Array.from(counts.entries()).map(([name, value]) => ({
        name,
        value,
      }));
      const rows = chartData.map((c) => ({
        status: c.name,
        count: c.value,
      }));
      return { meta, from, to, rows, chartData };
    }

    case "commission-summary": {
      const { data } = await admin
        .from("commissions")
        .select(
          "month, agent_id, commission_amount, net_commission, agent:users!agent_id(full_name)"
        )
        .eq("tenant_id", tenantId)
        .gte("month", from.slice(0, 7))
        .lte("month", to.slice(0, 7));

      const byAgent = new Map<
        string,
        { gross: number; net: number; agent: string }
      >();
      for (const row of data ?? []) {
        const agentRaw = row.agent as { full_name: string } | { full_name: string }[] | null;
        const agent =
          (Array.isArray(agentRaw) ? agentRaw[0]?.full_name : agentRaw?.full_name) ??
          row.agent_id;
        const cur = byAgent.get(agent) ?? { gross: 0, net: 0, agent };
        cur.gross += Number(row.commission_amount);
        cur.net += Number(row.net_commission);
        byAgent.set(agent, cur);
      }
      const rows = Array.from(byAgent.values()).map((r) => ({
        agent: r.agent,
        gross: Math.round(r.gross),
        net: Math.round(r.net),
      }));
      const chartData = rows.map((r) => ({
        agent: r.agent,
        gross: r.gross,
        net: r.net,
      }));
      return { meta, from, to, rows, chartData };
    }

    case "policy-lapse": {
      let q = admin
        .from("policies")
        .select(
          `policy_number, plan_name, lapsed_on, status, premium_amount,
           customer:customers(full_name), agent:users!agent_id(full_name)`
        )
        .eq("tenant_id", tenantId)
        .eq("status", "lapsed")
        .match(pFilter);
      if (from) q = q.gte("lapsed_on", from);
      if (to) q = q.lte("lapsed_on", to);
      const { data } = await q;
      const rows = (data ?? []).map((p) => {
        const cust = p.customer as { full_name: string } | { full_name: string }[] | null;
        const ag = p.agent as { full_name: string } | { full_name: string }[] | null;
        return {
          policyNumber: p.policy_number,
          customer: Array.isArray(cust) ? cust[0]?.full_name : cust?.full_name,
          plan: p.plan_name,
          lapsedOn: p.lapsed_on,
          premium: p.premium_amount,
          agent: Array.isArray(ag) ? ag[0]?.full_name : ag?.full_name,
        };
      });
      return { meta, from, to, rows, chartData: [] };
    }

    case "collection-efficiency": {
      let q = admin
        .from("payments")
        .select("payment_date, due_date, status")
        .eq("tenant_id", tenantId)
        .gte("payment_date", from)
        .lte("payment_date", to)
        .eq("status", "paid");
      if (!ctx.isManager) {
        const { data: pols } = await admin
          .from("policies")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("agent_id", ctx.userId);
        q = q.in(
          "policy_id",
          (pols ?? []).map((p) => p.id)
        );
      }
      const { data } = await q;
      const months: string[] = [];
      let cur = startOfMonth(parseISO(from));
      const end = parseISO(to);
      while (cur <= end) {
        months.push(format(cur, "yyyy-MM"));
        cur = addMonths(cur, 1);
      }
      const chartData = months.map((month) => {
        const inMonth = (data ?? []).filter((p) =>
          (p.payment_date as string).startsWith(month)
        );
        let onTime = 0;
        let late = 0;
        for (const p of inMonth) {
          const days = differenceInDays(
            parseISO(p.payment_date as string),
            parseISO(p.due_date as string)
          );
          if (days <= 0) onTime++;
          else late++;
        }
        return { month, onTime, late, total: inMonth.length };
      });
      return { meta, from, to, rows: chartData, chartData };
    }

    case "new-policies-monthly": {
      const { data } = await admin
        .from("policies")
        .select("created_at, policy_number, plan_name, agent:users!agent_id(full_name)")
        .eq("tenant_id", tenantId)
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .match(pFilter);
      const byMonth = new Map<string, number>();
      for (const p of data ?? []) {
        const m = format(new Date(p.created_at as string), "yyyy-MM");
        byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
      }
      const chartData = Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));
      const rows = (data ?? []).map((p) => {
        const ag = p.agent as { full_name: string } | { full_name: string }[] | null;
        return {
          created: format(new Date(p.created_at as string), "yyyy-MM-dd"),
          policyNumber: p.policy_number,
          plan: p.plan_name,
          agent: Array.isArray(ag) ? ag[0]?.full_name : ag?.full_name,
        };
      });
      return { meta, from, to, rows, chartData };
    }

    case "kyc-status": {
      const { data } = await admin
        .from("customers")
        .select("kyc_status")
        .eq("tenant_id", tenantId)
        .match(cFilter);
      const counts = new Map<string, number>();
      for (const c of data ?? []) {
        const s = (c.kyc_status as string) || "pending";
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
      const chartData = Array.from(counts.entries()).map(([name, value]) => ({
        name,
        value,
      }));
      return {
        meta,
        from,
        to,
        rows: chartData.map((c) => ({ status: c.name, count: c.value })),
        chartData,
      };
    }

    case "upcoming-maturities": {
      const horizon = format(addMonths(new Date(), 12), "yyyy-MM-dd");
      const { data } = await admin
        .from("policies")
        .select(
          `policy_number, plan_name, maturity_date, sum_assured, status,
           customer:customers(full_name)`
        )
        .eq("tenant_id", tenantId)
        .not("maturity_date", "is", null)
        .gte("maturity_date", format(new Date(), "yyyy-MM-dd"))
        .lte("maturity_date", horizon)
        .match(pFilter)
        .order("maturity_date", { ascending: true });
      const rows = (data ?? []).map((p) => {
        const cust = p.customer as { full_name: string } | { full_name: string }[] | null;
        return {
          policyNumber: p.policy_number,
          customer: Array.isArray(cust) ? cust[0]?.full_name : cust?.full_name,
          plan: p.plan_name,
          maturityDate: p.maturity_date,
          sumAssured: p.sum_assured,
          status: p.status,
        };
      });
      return { meta, from, to, rows, chartData: rows };
    }

    case "financial-year-summary": {
      const fy = params.fy ?? getFinancialYear(new Date());
      const [startY] = fy.split("-");
      const fyStart = `${startY}-04-01`;
      const fyEnd = `${Number(startY) + 1}-03-31`;

      const { data: payments } = await admin
        .from("payments")
        .select("amount_paid, status")
        .eq("tenant_id", tenantId)
        .gte("payment_date", fyStart)
        .lte("payment_date", fyEnd)
        .eq("status", "paid");

      const { data: commissions } = await admin
        .from("commissions")
        .select("net_commission, commission_amount")
        .eq("tenant_id", tenantId)
        .eq("financial_year", fy);

      const { count: newPolicies } = await admin
        .from("policies")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", `${fyStart}T00:00:00`)
        .lte("created_at", `${fyEnd}T23:59:59`);

      const { count: activePolicies } = await admin
        .from("policies")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "in_force");

      const premiumsCollected = (payments ?? []).reduce(
        (s, p) => s + Number(p.amount_paid),
        0
      );
      const netCommission = (commissions ?? []).reduce(
        (s, c) => s + Number(c.net_commission),
        0
      );
      const grossCommission = (commissions ?? []).reduce(
        (s, c) => s + Number(c.commission_amount),
        0
      );

      const summary = {
        financialYear: fy,
        premiumsCollected: Math.round(premiumsCollected),
        grossCommission: Math.round(grossCommission),
        netCommission: Math.round(netCommission),
        newPolicies: newPolicies ?? 0,
        activePolicies: activePolicies ?? 0,
      };

      const chartData = [
        { label: "Premiums", value: summary.premiumsCollected },
        { label: "Net commission", value: summary.netCommission },
        { label: "New policies", value: summary.newPolicies },
      ];

      return {
        meta,
        from: fyStart,
        to: fyEnd,
        rows: [summary],
        chartData,
        summary,
      };
    }

    default:
      return { error: "Not implemented" };
  }
}

export function reportRowsToCSV(
  rows: Record<string, unknown>[],
  columns: string[]
) {
  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const v = row[col] ?? row[col.charAt(0).toLowerCase() + col.slice(1)];
        return `"${String(v ?? "").replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}
