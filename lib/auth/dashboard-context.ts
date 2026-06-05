import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const { data: memberships } = await admin
    .from("tenant_members")
    .select("tenant_id, status, roles(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships?.length) return { error: "NO_TENANT", ctx: null };

  if (!tenantId || !memberships.some((m) => m.tenant_id === tenantId)) {
    tenantId = memberships[0].tenant_id;
  }
  const resolvedTenantId = tenantId as string;

  const membership = memberships.find((m) => m.tenant_id === resolvedTenantId)!;
  const rolesRaw = membership.roles as { name: string } | { name: string }[] | null;
  const roleName = (Array.isArray(rolesRaw) ? rolesRaw[0]?.name : rolesRaw?.name) ?? "agent";
  const role = roleName as DashboardRole;
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
