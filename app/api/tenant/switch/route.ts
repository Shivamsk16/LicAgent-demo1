import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { tenantId } = await request.json();
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_members")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return apiError("FORBIDDEN", "Not a member of this branch", 403);

  const res = apiSuccess({ tenantId });
  res.cookies.set("active_tenant", tenantId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
