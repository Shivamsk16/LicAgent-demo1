import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardContext } from "@/lib/auth/dashboard-context";

type AdminClient = ReturnType<typeof createAdminClient>;

export type PolicyAccessRow = {
  id: string;
  agent_id: string;
  customer_id: string;
};

export type CustomerAccessRow = {
  id: string;
  assigned_agent_id: string;
};

type ContextSlice = Pick<DashboardContext, "tenantId" | "userId" | "isManager">;

/** Fetch policy scoped to tenant; non-managers only see policies they own. */
export async function fetchPolicyForContext(
  admin: AdminClient,
  policyId: string,
  ctx: ContextSlice
): Promise<PolicyAccessRow | null> {
  let query = admin
    .from("policies")
    .select("id, agent_id, customer_id")
    .eq("id", policyId)
    .eq("tenant_id", ctx.tenantId);

  if (!ctx.isManager) {
    query = query.eq("agent_id", ctx.userId);
  }

  const { data } = await query.maybeSingle();
  return data;
}

/** Customer must belong to tenant; optional agent assignment check for non-managers. */
export async function fetchCustomerInTenant(
  admin: AdminClient,
  customerId: string,
  tenantId: string,
  opts?: { requireAssignedAgentId?: string }
): Promise<CustomerAccessRow | null> {
  let query = admin
    .from("customers")
    .select("id, assigned_agent_id")
    .eq("id", customerId)
    .eq("tenant_id", tenantId);

  if (opts?.requireAssignedAgentId) {
    query = query.eq("assigned_agent_id", opts.requireAssignedAgentId);
  }

  const { data } = await query.maybeSingle();
  return data;
}
