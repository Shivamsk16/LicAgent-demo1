import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Branch manager only", 403);
  }

  const { memberId } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const updates: Record<string, unknown> = {};

  if (body.role_name) {
    const { data: role } = await admin
      .from("roles")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .eq("name", body.role_name)
      .single();
    if (!role) return apiError("NOT_FOUND", "Role not found", 404);
    updates.role_id = role.id;
  }

  if (body.status) {
    updates.status = body.status;
    if (body.status === "suspended") {
      updates.suspended_at = new Date().toISOString();
      updates.suspended_reason = body.reason ?? null;
    }
    if (body.status === "active") {
      updates.joined_at = new Date().toISOString();
      updates.suspended_at = null;
      updates.suspended_reason = null;
    }
    if (body.status === "removed") {
      updates.suspended_at = new Date().toISOString();
    }
  }

  const { data, error: dbError } = await admin
    .from("tenant_members")
    .update(updates)
    .eq("id", memberId)
    .eq("tenant_id", ctx.tenantId)
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: body.status ? `member.${body.status}` : "member.role_changed",
    resourceType: "tenant_member",
    resourceId: memberId,
    afterState: data as unknown as Record<string, unknown>,
  });

  return apiSuccess(data);
}
