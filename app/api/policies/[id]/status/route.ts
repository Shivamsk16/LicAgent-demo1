import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { status, reason } = await request.json();
  const admin = createAdminClient();

  const { data: before } = await admin
    .from("policies")
    .select("*")
    .eq("id", params.id)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!before) return apiError("NOT_FOUND", "Policy not found", 404);

  if (status === "lapsed" && ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Only manager can mark lapsed", 403);
  }

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "lapsed") {
    updates.lapsed_on = new Date().toISOString().slice(0, 10);
    updates.revival_deadline = new Date(
      Date.now() + 2 * 365 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);
  }

  const { data, error: dbError } = await admin
    .from("policies")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: "policy.status_changed",
    resourceType: "policy",
    resourceId: params.id,
    beforeState: { status: before.status },
    afterState: { status, reason },
  });

  return apiSuccess(data);
}
