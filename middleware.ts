import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  getActiveMemberships,
  membershipRole,
} from "@/lib/auth/memberships";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/select-tenant",
  "/auth/callback",
];

function authDebug(payload: Record<string, unknown>) {
  console.log("[auth-debug]", JSON.stringify(payload));
}

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/invite/");

  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    authDebug({ event: "unauthenticated", pathname, redirectTo: url.toString() });
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/superadmin")) {
    const superAdmin = await isSuperAdmin(user.id);
    if (!superAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      authDebug({
        event: "superadmin_forbidden",
        userId: user.id,
        redirectTo: url.pathname,
      });
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname.startsWith("/dashboard")) {
    const superAdmin = await isSuperAdmin(user.id);
    if (superAdmin) {
      authDebug({
        event: "dashboard_super_admin_bypass",
        userId: user.id,
        role: "super_admin",
        tenantId: null,
        redirectTo: "next",
      });
      return supabaseResponse;
    }

    let memberships: Awaited<ReturnType<typeof getActiveMemberships>> = [];
    try {
      memberships = await getActiveMemberships(user.id);
    } catch (err) {
      authDebug({
        event: "membership_lookup_failed",
        userId: user.id,
        error: err instanceof Error ? err.message : "unknown",
      });
    }

    if (!memberships.length) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "no_tenant");
      authDebug({
        event: "no_tenant",
        userId: user.id,
        tenantId: request.cookies.get("active_tenant")?.value ?? null,
        membershipCount: 0,
        redirectTo: url.toString(),
      });
      return NextResponse.redirect(url);
    }

    const activeTenant =
      request.cookies.get("active_tenant")?.value ?? memberships[0].tenant_id;
    const membership =
      memberships.find((m) => m.tenant_id === activeTenant) ?? memberships[0];
    const role = membershipRole(membership);

    authDebug({
      event: "dashboard_allowed",
      userId: user.id,
      role,
      tenantId: membership.tenant_id,
      resolvedTenant: membership.tenant_id,
      redirectTo: "next",
    });

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

    // Break redirect loop: do not send no_tenant users back to /dashboard.
    if (errorParam === "no_tenant") {
      authDebug({
        event: "login_stay_no_tenant",
        userId: user.id,
        redirectTo: "stay",
      });
      return supabaseResponse;
    }

    const superAdmin = await isSuperAdmin(user.id);
    const url = request.nextUrl.clone();

    if (superAdmin) {
      url.pathname = "/superadmin";
      authDebug({
        event: "login_redirect_superadmin",
        userId: user.id,
        role: "super_admin",
        redirectTo: url.pathname,
      });
      return NextResponse.redirect(url);
    }

    let memberships: Awaited<ReturnType<typeof getActiveMemberships>> = [];
    try {
      memberships = await getActiveMemberships(user.id);
    } catch (err) {
      authDebug({
        event: "membership_lookup_failed",
        userId: user.id,
        error: err instanceof Error ? err.message : "unknown",
      });
    }

    if (!memberships.length) {
      if (pathname === "/") {
        url.pathname = "/login";
        url.searchParams.set("error", "no_tenant");
        authDebug({
          event: "root_no_tenant",
          userId: user.id,
          membershipCount: 0,
          redirectTo: url.toString(),
        });
        return NextResponse.redirect(url);
      }
      authDebug({
        event: "login_no_tenant_stay",
        userId: user.id,
        membershipCount: 0,
        redirectTo: "stay",
      });
      return supabaseResponse;
    }

    if (memberships.length > 1) {
      url.pathname = "/select-tenant";
    } else {
      url.pathname = "/dashboard";
    }
    authDebug({
      event: "login_redirect_dashboard",
      userId: user.id,
      role: membershipRole(memberships[0]),
      tenantId: memberships[0].tenant_id,
      membershipCount: memberships.length,
      redirectTo: url.pathname,
    });
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
