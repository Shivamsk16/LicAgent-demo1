import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/select-tenant",
  "/auth/callback",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/invite/");

  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const { user, supabase, supabaseResponse } = await updateSession(request);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/superadmin")) {
    const { data: profile } = await supabase
      .from("users")
      .select("super_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.super_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname.startsWith("/dashboard")) {
    const { data: memberships } = await supabase
      .from("tenant_members")
      .select("tenant_id, status, roles(name)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (!memberships?.length) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "no_tenant");
      return NextResponse.redirect(url);
    }

    const activeTenant =
      request.cookies.get("active_tenant")?.value ?? memberships[0].tenant_id;
    const membership = memberships.find((m) => m.tenant_id === activeTenant);
    const rolesRaw = membership?.roles as { name: string } | { name: string }[] | null | undefined;
    const role = (Array.isArray(rolesRaw) ? rolesRaw[0]?.name : rolesRaw?.name) ?? "";

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-id", activeTenant);
    requestHeaders.set("x-user-role", role);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    supabaseResponse.cookies.getAll().forEach((c) => response.cookies.set(c));
    if (!request.cookies.get("active_tenant")) {
      response.cookies.set("active_tenant", activeTenant, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    const { data: profile } = await supabase
      .from("users")
      .select("super_admin")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.super_admin) {
      url.pathname = "/superadmin";
    } else {
      const { data: memberships } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if ((memberships?.length ?? 0) > 1) {
        url.pathname = "/select-tenant";
      } else {
        url.pathname = "/dashboard";
      }
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
