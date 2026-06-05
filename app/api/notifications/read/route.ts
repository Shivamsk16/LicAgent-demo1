import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function PATCH(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { ids, all } = await request.json();
  const admin = createAdminClient();

  if (all) {
    await admin
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", ctx.userId);
    return apiSuccess({ ok: true });
  }

  if (Array.isArray(ids) && ids.length) {
    await admin
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", ctx.userId);
  }

  return apiSuccess({ ok: true });
}
