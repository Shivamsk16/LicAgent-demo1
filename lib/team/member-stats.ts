import type { SupabaseClient } from "@supabase/supabase-js";

function parseGroupedCount(
  rows: Array<Record<string, unknown>> | null,
  key: string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const id = row[key];
    if (typeof id !== "string") continue;
    const countVal = row.count;
    const n =
      typeof countVal === "number"
        ? countVal
        : typeof countVal === "object" &&
            countVal !== null &&
            "count" in countVal
          ? Number((countVal as { count: number | null }).count ?? 0)
          : 0;
    counts.set(id, n);
  }
  return counts;
}

function parseGroupedSum(
  rows: Array<Record<string, unknown>> | null,
  key: string,
  sumField: string
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows ?? []) {
    const id = row[key];
    if (typeof id !== "string") continue;
    const sumVal = row[sumField];
    const n =
      typeof sumVal === "number"
        ? sumVal
        : typeof sumVal === "object" && sumVal !== null && "sum" in sumVal
          ? Number((sumVal as { sum: number | null }).sum ?? 0)
          : 0;
    totals.set(id, n);
  }
  return totals;
}

export async function getTeamMemberStats(
  admin: SupabaseClient,
  tenantId: string,
  userIds: string[],
  monthKey: string
): Promise<
  Map<
    string,
    { customers: number; policies: number; commissionMonth: number }
  >
> {
  const stats = new Map<
    string,
    { customers: number; policies: number; commissionMonth: number }
  >();

  if (!userIds.length) return stats;

  for (const uid of userIds) {
    stats.set(uid, { customers: 0, policies: 0, commissionMonth: 0 });
  }

  const [
    { data: customerRows },
    { data: policyRows },
    { data: commissionRows },
  ] = await Promise.all([
    admin
      .from("customers")
      .select("assigned_agent_id, count()")
      .eq("tenant_id", tenantId)
      .in("assigned_agent_id", userIds),
    admin
      .from("policies")
      .select("agent_id, count()")
      .eq("tenant_id", tenantId)
      .eq("status", "in_force")
      .in("agent_id", userIds),
    admin
      .from("commissions")
      .select("agent_id, net_commission.sum()")
      .eq("tenant_id", tenantId)
      .eq("month", monthKey)
      .in("agent_id", userIds),
  ]);

  const customerCounts = parseGroupedCount(
    customerRows as Array<Record<string, unknown>> | null,
    "assigned_agent_id"
  );
  const policyCounts = parseGroupedCount(
    policyRows as Array<Record<string, unknown>> | null,
    "agent_id"
  );
  const commissionTotals = parseGroupedSum(
    commissionRows as Array<Record<string, unknown>> | null,
    "agent_id",
    "net_commission"
  );

  for (const uid of userIds) {
    stats.set(uid, {
      customers: customerCounts.get(uid) ?? 0,
      policies: policyCounts.get(uid) ?? 0,
      commissionMonth: commissionTotals.get(uid) ?? 0,
    });
  }

  return stats;
}
