import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActiveMemberships,
} from "@/lib/auth/cached-auth";
import {
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
  userName?: string;
  membershipCount: number;
}

type DashboardContextResult =
  | { error: DashboardContextError; ctx: null }
  | { error: null; ctx: DashboardContext };

const MANAGER_ROLES: DashboardRole[] = ["branch_manager", "senior_agent"];

function buildContext(
  userId: string,
  email: string,
  tenantId: string,
  role: DashboardRole,
  tenant: Tenant,
  userName?: string,
  membershipCount = 1
): DashboardContextResult {
  const denial = getTenantAccessDenial(tenant);
  if (denial) {
    return { error: denialToContextError(denial), ctx: null };
  }

  return {
    error: null,
    ctx: {
      userId,
      email,
      tenantId,
      role,
      isManager: MANAGER_ROLES.includes(role),
      tenant,
      userName,
      membershipCount,
    },
  };
}

const resolveFromMiddlewareHeaders = cache(
  async (): Promise<DashboardContextResult | null> => {
  const h = await headers();
  const userId = h.get("x-user-id");
  const tenantId = h.get("x-tenant-id");
  const role = h.get("x-user-role") as DashboardRole | null;
  if (!userId || !tenantId || !role) return null;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (!tenant) return { error: "FORBIDDEN", ctx: null };

  const membershipCount = Number(h.get("x-membership-count") ?? "1");
  const userNameFromHeader = h.get("x-user-full-name");

  return buildContext(
    userId,
    h.get("x-user-email") ?? "",
    tenantId,
    role,
    tenant as Tenant,
    userNameFromHeader ?? undefined,
    membershipCount
  );
  }
);

const resolveDashboardContextFull = cache(
  async (): Promise<DashboardContextResult> => {
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

    const [{ data: tenant }, { data: profile }] = await Promise.all([
      admin.from("tenants").select("*").eq("id", resolvedTenantId).single(),
      admin.from("users").select("full_name").eq("id", user.id).single(),
    ]);

    return buildContext(
      user.id,
      user.email ?? "",
      resolvedTenantId,
      role,
      tenant as Tenant,
      profile?.full_name,
      memberships.length
    );
  }
);

export async function getDashboardContext(): Promise<DashboardContextResult> {
  const fromHeaders = await resolveFromMiddlewareHeaders();
  if (fromHeaders) return fromHeaders;
  return resolveDashboardContextFull();
}

export const getCachedDashboardContext = getDashboardContext;
