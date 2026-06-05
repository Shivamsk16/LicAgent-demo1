import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanMRR } from "@/lib/business/provision-tenant";
import type { Tenant, TenantWithStats } from "@/types/database";

export async function getPlatformStats() {
  const admin = createAdminClient();

  const { count: totalBranches } = await admin
    .from("tenants")
    .select("*", { count: "exact", head: true });

  const { count: activeBranches } = await admin
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: trialBranches } = await admin
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("plan", "trial");

  const { count: totalAgents } = await admin
    .from("tenant_members")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: activePolicies } = await admin
    .from("policies")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_force");

  const { data: paidTenants } = await admin
    .from("tenants")
    .select("plan, billing_cycle")
    .eq("status", "active")
    .neq("plan", "trial");

  const mrr = (paidTenants ?? []).reduce(
    (sum, t) => sum + getPlanMRR(t.plan, t.billing_cycle),
    0
  );

  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: expiringTrials } = await admin
    .from("tenants")
    .select("*")
    .eq("plan", "trial")
    .eq("status", "active")
    .lte("trial_ends_at", sevenDays)
    .order("trial_ends_at", { ascending: true });

  const { data: recentTenants } = await admin
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const tenantsWithStats = await attachTenantStats(recentTenants ?? []);

  const { data: allTenants } = await admin.from("tenants").select("created_at, plan");
  const signupsByMonth = buildMonthlySignups(allTenants ?? []);
  const planBreakdown = buildPlanBreakdown(allTenants ?? []);

  return {
    totalBranches: totalBranches ?? 0,
    activeBranches: activeBranches ?? 0,
    trialBranches: trialBranches ?? 0,
    totalAgents: totalAgents ?? 0,
    activePolicies: activePolicies ?? 0,
    platformMRR: mrr,
    expiringTrials: expiringTrials ?? [],
    recentTenants: tenantsWithStats,
    signupsByMonth,
    planBreakdown,
  };
}

export async function attachTenantStats(tenants: Tenant[]): Promise<TenantWithStats[]> {
  const admin = createAdminClient();
  const result: TenantWithStats[] = [];

  for (const t of tenants) {
    const { count: agent_count } = await admin
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", t.id)
      .eq("status", "active");

    const { count: policy_count } = await admin
      .from("policies")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", t.id);

    result.push({
      ...t,
      agent_count: agent_count ?? 0,
      policy_count: policy_count ?? 0,
    });
  }

  return result;
}

function buildMonthlySignups(tenants: { created_at: string }[]) {
  const months: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = 0;
  }
  tenants.forEach((t) => {
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in months) months[key]++;
  });
  return Object.entries(months).map(([month, count]) => ({ month, count }));
}

function buildPlanBreakdown(tenants: { plan: string }[]) {
  const counts: Record<string, number> = {
    trial: 0,
    starter: 0,
    pro: 0,
    enterprise: 0,
  };
  tenants.forEach((t) => {
    if (t.plan in counts) counts[t.plan]++;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export async function getTenantDetail(tenantId: string) {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (!tenant) return null;

  const { count: customer_count } = await admin
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const { count: active_policies } = await admin
    .from("policies")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "in_force");

  const { count: lapsed_policies } = await admin
    .from("policies")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "lapsed");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const { count: payments_this_month } = await admin
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("payment_date", startOfMonth.toISOString().slice(0, 10));

  const { data: commissionSum } = await admin
    .from("commissions")
    .select("net_commission")
    .eq("tenant_id", tenantId)
    .eq("status", "paid");

  const total_commission_paid = (commissionSum ?? []).reduce(
    (s, c) => s + Number(c.net_commission),
    0
  );

  return {
    tenant,
    stats: {
      customer_count: customer_count ?? 0,
      active_policies: active_policies ?? 0,
      lapsed_policies: lapsed_policies ?? 0,
      payments_this_month: payments_this_month ?? 0,
      total_commission_paid,
    },
  };
}
