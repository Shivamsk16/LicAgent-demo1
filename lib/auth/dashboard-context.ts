import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActiveMemberships,
  membershipRole,
} from "@/lib/auth/memberships";
import type { Tenant } from "@/types/database";

export type DashboardRole =
  | "branch_manager"
  | "senior_agent"
  | "agent"
  | "viewer";

export interface DashboardContext {
  userId: string;
  email: string;
  tenantId: string;
  role: DashboardRole;
  isManager: boolean;
  tenant: Tenant;
}

export async function getDashboardContext(): Promise<
  | { error: "UNAUTHORIZED" | "NO_TENANT" | "FORBIDDEN"; ctx: null }
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

  const { data: profile } = await admin
    .from("users")
    .select("super_admin")
    .eq("id", user.id)
    .single();

  const memberships = await getActiveMemberships(user.id);

  if (!memberships.length) {
    if (profile?.super_admin) {
      console.log("[auth-debug]", JSON.stringify({
        event: "dashboard_context_super_admin_no_tenant",
        userId: user.id,
        role: "super_admin",
        tenantId: null,
        redirectTo: "FORBIDDEN",
      }));
    }
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

  if (!tenant || tenant.status !== "active") {
    return { error: "FORBIDDEN", ctx: null };
  }

  if (
    tenant.plan === "trial" &&
    tenant.trial_ends_at &&
    new Date(tenant.trial_ends_at) < new Date()
  ) {
    return { error: "FORBIDDEN", ctx: null };
  }

  console.log("[auth-debug]", JSON.stringify({
    event: "dashboard_context_resolved",
    userId: user.id,
    role,
    tenantId: resolvedTenantId,
    resolvedTenant: tenant.name,
    redirectTo: "next",
  }));

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
