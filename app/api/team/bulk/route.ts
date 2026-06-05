import { z } from "zod";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  status: z.enum(["active", "suspended"]),
  reason: z.string().optional(),
});

export async function PATCH(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Branch manager only", 403);
  }

  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { status: parsed.data.status };

  if (parsed.data.status === "suspended") {
    updates.suspended_at = now;
    updates.suspended_reason = parsed.data.reason ?? null;
  } else {
    updates.joined_at = now;
    updates.suspended_at = null;
    updates.suspended_reason = null;
  }

  const { data, error: dbError } = await admin
    .from("tenant_members")
    .update(updates)
    .eq("tenant_id", ctx.tenantId)
    .in("id", parsed.data.ids)
    .neq("status", "invited")
    .select("id");

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: `member.bulk_${parsed.data.status}`,
    resourceType: "tenant_member",
    resourceId: parsed.data.ids.join(","),
    afterState: { count: data?.length ?? 0, status: parsed.data.status },
  });

  return apiSuccess({ updated: data?.length ?? 0 });
}
