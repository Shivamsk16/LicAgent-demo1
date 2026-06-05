import { z } from "zod";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(["lapsed", "in_force", "surrendered", "matured"]),
});

export async function PATCH(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  if (parsed.data.status === "lapsed" && ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Only manager can mark lapsed", 403);
  }

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.status === "lapsed") {
    updates.lapsed_on = new Date().toISOString().slice(0, 10);
    updates.revival_deadline = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  let updateQuery = admin
    .from("policies")
    .update(updates)
    .eq("tenant_id", ctx.tenantId)
    .in("id", parsed.data.ids);

  if (!ctx.isManager) {
    updateQuery = updateQuery.eq("agent_id", ctx.userId);
  }

  const { data, error: dbError } = await updateQuery.select("id");

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: "policy.bulk_status",
    resourceType: "policy",
    resourceId: parsed.data.ids.join(","),
    afterState: { count: data?.length ?? 0, status: parsed.data.status },
  });

  return apiSuccess({ updated: data?.length ?? 0 });
}
