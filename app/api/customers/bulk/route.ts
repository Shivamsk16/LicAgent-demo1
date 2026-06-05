import { z } from "zod";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

const bulkSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100),
    assigned_agent_id: z.string().uuid().optional(),
    kyc_status: z
      .enum(["pending", "documents_uploaded", "verified", "rejected"])
      .optional(),
  })
  .refine((d) => d.assigned_agent_id || d.kyc_status, {
    message: "Provide assigned_agent_id or kyc_status",
  });

export async function PATCH(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (!ctx.isManager) return apiError("FORBIDDEN", "Managers only", 403);

  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (parsed.data.assigned_agent_id) {
    updates.assigned_agent_id = parsed.data.assigned_agent_id;
  }
  if (parsed.data.kyc_status) {
    if (!ctx.isManager) return apiError("FORBIDDEN", "Managers only", 403);
    updates.kyc_status = parsed.data.kyc_status;
  }

  const { data, error: dbError } = await admin
    .from("customers")
    .update(updates)
    .eq("tenant_id", ctx.tenantId)
    .in("id", parsed.data.ids)
    .select("id");

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: parsed.data.kyc_status ? "customer.bulk_kyc" : "customer.bulk_assign",
    resourceType: "customer",
    resourceId: parsed.data.ids.join(","),
    afterState: {
      count: data?.length ?? 0,
      ...(parsed.data.assigned_agent_id && { agent_id: parsed.data.assigned_agent_id }),
      ...(parsed.data.kyc_status && { kyc_status: parsed.data.kyc_status }),
    },
  });

  return apiSuccess({ updated: data?.length ?? 0 });
}
