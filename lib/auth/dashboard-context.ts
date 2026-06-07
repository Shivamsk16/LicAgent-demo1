import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActiveMemberships,
  membershipRole,
} from "@/lib/auth/memberships";
import {
  denialToContextError,
  getTenantAccessDenial,
} from "@/lib/auth/tenant-access";
import type { Tenant } from "@/types/database";

export type DashboardRole =
  | "branch_manager"
  | "senior_agent"
  | "agent"
  | "viewer";

export type DashboardContextError =
  | "UNAUTHORIZED"
  | "NO_TENANT"
  | "FORBIDDEN"
  | "TRIAL_EXPIRED"
  | "ACCOUNT_SUSPENDED";

export interface DashboardContext {
  userId: string;
  email: string;
  tenantId: string;
  role: DashboardRole;
  isManager: boolean;
  tenant: Tenant;
}

export async function getDashboardContext(): Promise<
  | { error: DashboardContextError; ctx: null }
  | { error: null; ctx: DashboardContext }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "UNAUTHORIZED", ctx: null };

  const cookieStore = await cookies();
  let tenantId = cookieStore.get("active_tenant")?.value;

  const admin = createAdminClient();

  const memberships = await getActiveMemberships(user.id);

  if (!memberships.length) {
    return { error: "NO_TENANT", ctx: null };
  }

  if (!tenantId || !memberships.some((m) => m.tenant_id === tenantId)) {
    tenantId = memberships[0].tenant_id;
  }
  const resolvedTenantId = tenantId as string;

  const membership = memberships.find((m) => m.tenant_id === resolvedTenantId)!;
  const role = (membershipRole(membership) || "agent") as DashboardRole;
  const isManager = role === "branch_manager" || role === "senior_agent";

  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("id", resolvedTenantId)
    .single();

  const denial = getTenantAccessDenial(tenant as Tenant | null);
  if (denial) {
    return { error: denialToContextError(denial), ctx: null };
  }

  return {
    error: null,
    ctx: {
      userId: user.id,
      email: user.email ?? "",
      tenantId: resolvedTenantId,
      role,
      isManager,
      tenant: tenant as Tenant,
    },
  };
}
