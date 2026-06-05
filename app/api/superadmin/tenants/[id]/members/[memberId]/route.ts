import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function PUT(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  const { error, user } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const body = await request.json();
  const admin = createAdminClient();

  if (body.role_name) {
    const { data: role } = await admin
      .from("roles")
      .select("id")
      .eq("tenant_id", params.id)
      .eq("name", body.role_name)
      .single();
    if (!role) return apiError("NOT_FOUND", "Role not found", 404);
    body.role_id = role.id;
  }

  const updates: Record<string, unknown> = {};
  if (body.role_id) updates.role_id = body.role_id;
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
    .eq("id", params.memberId)
    .eq("tenant_id", params.id)
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: user.id,
    tenantId: params.id,
    action: body.status ? `member.${body.status}` : "member.role_changed",
    resourceType: "tenant_member",
    resourceId: params.memberId,
    afterState: data,
  });

  return apiSuccess(data);
}
