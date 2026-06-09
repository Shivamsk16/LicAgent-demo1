import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardContext } from "@/lib/auth/dashboard-context";
import { startOfMonth, endOfMonth, addDays, format } from "date-fns";

export async function getAgentDashboardStats(ctx: DashboardContext) {
  const admin = createAdminClient();
  const agentFilter = ctx.isManager ? {} : { assigned_agent_id: ctx.userId };
  const policyAgentFilter = ctx.isManager ? {} : { agent_id: ctx.userId };
  const monthKey = format(new Date(), "yyyy-MM");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const weekEnd = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const [
    { count: customerCount },
    { count: activePolicies },
    { count: premiumsDueThisMonth },
    { count: overdueCount },
    { count: kycPending },
    { count: paymentCount },
    commissionResult,
    { data: dueThisWeek },
    { data: recentPayments },
  ] = await Promise.all([
    admin
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .match(agentFilter),
    admin
      .from("policies")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("status", "in_force")
      .match(policyAgentFilter),
    (() => {
      let q = admin
        .from("policies")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .eq("status", "in_force")
        .gte("next_premium_due", monthStart)
        .lte("next_premium_due", monthEnd);
      if (!ctx.isManager) q = q.eq("agent_id", ctx.userId);
      return q;
    })(),
    (() => {
      let q = admin
        .from("policies")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .in("status", ["in_force", "grace_period"])
        .lt("next_premium_due", today);
      if (!ctx.isManager) q = q.eq("agent_id", ctx.userId);
      return q;
    })(),
    (() => {
      let q = admin
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .eq("kyc_status", "pending");
      if (!ctx.isManager) q = q.eq("assigned_agent_id", ctx.userId);
      return q;
    })(),
    (() => {
      let q = admin
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId);
      if (!ctx.isManager) q = q.eq("recorded_by", ctx.userId);
      return q;
    })(),
    (() => {
      let q = admin
        .from("commissions")
        .select("net_commission.sum()")
        .eq("tenant_id", ctx.tenantId)
        .eq("month", monthKey);
      if (!ctx.isManager) q = q.eq("agent_id", ctx.userId);
      return q.single();
    })(),
    (() => {
      let q = admin
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
      if (!ctx.isManager) q = q.eq("agent_id", ctx.userId);
      return q;
    })(),
    (() => {
      let q = admin
        .from("payments")
        .select(
          `id, payment_date, amount_paid, receipt_number, status,
           policy:policies(policy_number),
           customer:customers(full_name)`
        )
        .eq("tenant_id", ctx.tenantId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!ctx.isManager) q = q.eq("recorded_by", ctx.userId);
      return q;
    })(),
  ]);

  const commissionRow = commissionResult.data as {
    net_commission?: number | { sum: number | null } | null;
  } | null;
  const commissionMonth =
    typeof commissionRow?.net_commission === "object" &&
    commissionRow?.net_commission !== null
      ? Number(commissionRow.net_commission.sum ?? 0)
      : Number(commissionRow?.net_commission ?? 0);

  return {
    customerCount: customerCount ?? 0,
    activePolicies: activePolicies ?? 0,
    premiumsDueThisMonth: premiumsDueThisMonth ?? 0,
    overdueCount: overdueCount ?? 0,
    kycPending: kycPending ?? 0,
    paymentCount: paymentCount ?? 0,
    commissionMonth,
    dueThisWeek: dueThisWeek ?? [],
    recentPayments: recentPayments ?? [],
    isManager: ctx.isManager,
  };
}
