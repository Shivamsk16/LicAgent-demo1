import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardContext } from "@/lib/auth/dashboard-context";
import { startOfMonth, endOfMonth, addDays, format } from "date-fns";

export async function getAgentDashboardStats(ctx: DashboardContext) {
  const admin = createAdminClient();
  const agentFilter = ctx.isManager ? {} : { assigned_agent_id: ctx.userId };
  const policyAgentFilter = ctx.isManager ? {} : { agent_id: ctx.userId };

  const { count: customerCount } = await admin
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .match(agentFilter);

  const { count: activePolicies } = await admin
    .from("policies")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "in_force")
    .match(policyAgentFilter);

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  let dueQuery = admin
    .from("policies")
    .select("id, next_premium_due, premium_amount")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "in_force")
    .gte("next_premium_due", monthStart)
    .lte("next_premium_due", monthEnd);

  if (!ctx.isManager) dueQuery = dueQuery.eq("agent_id", ctx.userId);
  const { data: dueThisMonth } = await dueQuery;

  let overdueQuery = admin
    .from("policies")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .in("status", ["in_force", "grace_period"])
    .lt("next_premium_due", format(new Date(), "yyyy-MM-dd"));

  if (!ctx.isManager) overdueQuery = overdueQuery.eq("agent_id", ctx.userId);
  const { count: overdueCount } = await overdueQuery;

  const monthKey = format(new Date(), "yyyy-MM");
  let commQuery = admin
    .from("commissions")
    .select("net_commission")
    .eq("tenant_id", ctx.tenantId)
    .eq("month", monthKey);

  if (!ctx.isManager) commQuery = commQuery.eq("agent_id", ctx.userId);
  const { data: commissions } = await commQuery;
  const commissionMonth = (commissions ?? []).reduce(
    (s, c) => s + Number(c.net_commission),
    0
  );

  const weekEnd = format(addDays(new Date(), 7), "yyyy-MM-dd");
  let dueWeekQuery = admin
    .from("policies")
    .select(
      `id, policy_number, plan_name, premium_amount, next_premium_due, status,
       customer:customers(id, full_name)`
    )
    .eq("tenant_id", ctx.tenantId)
    .in("status", ["in_force", "grace_period"])
    .lte("next_premium_due", weekEnd)
    .order("next_premium_due", { ascending: true })
    .limit(10);

  if (!ctx.isManager) dueWeekQuery = dueWeekQuery.eq("agent_id", ctx.userId);
  const { data: dueThisWeek } = await dueWeekQuery;

  let recentPayQuery = admin
    .from("payments")
    .select(
      `id, payment_date, amount_paid, receipt_number, status,
       policy:policies(policy_number),
       customer:customers(full_name)`
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!ctx.isManager) recentPayQuery = recentPayQuery.eq("recorded_by", ctx.userId);
  const { data: recentPayments } = await recentPayQuery;

  return {
    customerCount: customerCount ?? 0,
    activePolicies: activePolicies ?? 0,
    premiumsDueThisMonth: dueThisMonth?.length ?? 0,
    overdueCount: overdueCount ?? 0,
    commissionMonth,
    dueThisWeek: dueThisWeek ?? [],
    recentPayments: recentPayments ?? [],
    isManager: ctx.isManager,
  };
}
