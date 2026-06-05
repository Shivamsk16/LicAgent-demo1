import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const unreadOnly = new URL(request.url).searchParams.get("unread") === "true";
  const admin = createAdminClient();

  let query = admin
    .from("notifications")
    .select("*")
    .eq("user_id", ctx.userId)
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) query = query.eq("read", false);

  const { data, error: dbError } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  const { count } = await admin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .eq("read", false);

  return apiSuccess({ notifications: data, unreadCount: count ?? 0 });
}
