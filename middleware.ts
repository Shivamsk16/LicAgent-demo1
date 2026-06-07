import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  getActiveMemberships,
  membershipRole,
} from "@/lib/auth/memberships";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPublicApiRoute, shouldApiReturnUnauthorized } from "@/lib/auth/public-api";
import { apiUnauthorizedResponse } from "@/lib/api/unauthorized";
import { denialToPath, getTenantAccessDenial } from "@/lib/auth/tenant-access";
import type { Tenant } from "@/types/database";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/select-tenant",
  "/auth/callback",
  "/trial-expired",
  "/account-suspended",
];

const ACCOUNT_STATUS_ROUTES = ["/trial-expired", "/account-suspended"];

async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("super_admin")
      .eq("id", userId)
      .single();
    return data?.super_admin === true;
  } catch {
    return false;
  }
}

async function getTenantDenialForMembership(
  tenantId: string
): Promise<ReturnType<typeof getTenantAccessDenial>> {
  try {
    const admin = createAdminClient();
    const { data: tenant } = await admin
      .from("tenants")
      .select("status, plan, trial_ends_at")
      .eq("id", tenantId)
      .single();
    return getTenantAccessDenial(tenant as Tenant | null);
  } catch {
    return "inactive";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/invite/");

  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);

  if (shouldApiReturnUnauthorized(pathname, !!user)) {
    return apiUnauthorizedResponse();
  }

  if (ACCOUNT_STATUS_ROUTES.includes(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/superadmin")) {
    const superAdmin = await isSuperAdmin(user.id);
    if (!superAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname.startsWith("/dashboard")) {
    const superAdmin = await isSuperAdmin(user.id);
    if (superAdmin) {
      return supabaseResponse;
    }

    let memberships: Awaited<ReturnType<typeof getActiveMemberships>> = [];
    try {
      memberships = await getActiveMemberships(user.id);
    } catch {
      /* membership lookup failed */
    }

    if (!memberships.length) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "no_tenant");
      return NextResponse.redirect(url);
    }

    const activeTenant =
      request.cookies.get("active_tenant")?.value ?? memberships[0].tenant_id;
    const membership =
      memberships.find((m) => m.tenant_id === activeTenant) ?? memberships[0];

    const denial = await getTenantDenialForMembership(membership.tenant_id);
    if (denial) {
      const url = request.nextUrl.clone();
      url.pathname = denialToPath(denial);
      return NextResponse.redirect(url);
    }

    const role = membershipRole(membership);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-id", membership.tenant_id);
    requestHeaders.set("x-user-role", role);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.cookies.getAll().forEach((c) => response.cookies.set(c));
    if (!request.cookies.get("active_tenant")) {
      response.cookies.set("active_tenant", membership.tenant_id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    const errorParam = request.nextUrl.searchParams.get("error");

    if (errorParam === "no_tenant") {
      return supabaseResponse;
    }

    const superAdmin = await isSuperAdmin(user.id);
    const url = request.nextUrl.clone();

    if (superAdmin) {
      url.pathname = "/superadmin";
      return NextResponse.redirect(url);
    }

    let memberships: Awaited<ReturnType<typeof getActiveMemberships>> = [];
    try {
      memberships = await getActiveMemberships(user.id);
    } catch {
      /* membership lookup failed */
    }

    if (!memberships.length) {
      if (pathname === "/") {
        url.pathname = "/login";
        url.searchParams.set("error", "no_tenant");
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    const activeTenant =
      request.cookies.get("active_tenant")?.value ?? memberships[0].tenant_id;
    const membership =
      memberships.find((m) => m.tenant_id === activeTenant) ?? memberships[0];

    const denial = await getTenantDenialForMembership(membership.tenant_id);
    if (denial) {
      url.pathname = denialToPath(denial);
      return NextResponse.redirect(url);
    }

    if (memberships.length > 1) {
      url.pathname = "/select-tenant";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
