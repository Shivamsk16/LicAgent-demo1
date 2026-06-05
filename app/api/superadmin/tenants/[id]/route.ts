import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { getTenantDetail } from "@/lib/superadmin/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  branch_code: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  plan: z.enum(["trial", "starter", "pro", "enterprise"]).optional(),
  max_agents: z.number().int().optional(),
  billing_cycle: z.enum(["monthly", "yearly"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);

  const detail = await getTenantDetail(params.id);
  if (!detail) return apiError("NOT_FOUND", "Branch not found", 404);
  return apiSuccess(detail);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid input", 400);
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("tenants")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!before) return apiError("NOT_FOUND", "Branch not found", 404);

  const { data, error: dbError } = await admin
    .from("tenants")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: user.id,
    tenantId: params.id,
    action: "tenant.updated",
    resourceType: "tenant",
    resourceId: params.id,
    beforeState: before,
    afterState: data,
  });

  return apiSuccess(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const { status, reason } = await request.json();
  if (!["active", "suspended", "cancelled"].includes(status)) {
    return apiError("VALIDATION_ERROR", "Invalid status", 400);
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("tenants")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data, error: dbError } = await admin
    .from("tenants")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: user.id,
    tenantId: params.id,
    action: `tenant.${status}`,
    resourceType: "tenant",
    resourceId: params.id,
    beforeState: before ?? undefined,
    afterState: { ...data, reason },
  });

  return apiSuccess(data);
}
