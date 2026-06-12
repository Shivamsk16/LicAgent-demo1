import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerUpdateSchema } from "@/lib/utils/validators";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";
import { validationApiError } from "@/lib/api/zod-error";

async function getCustomer(id: string, ctx: NonNullable<Awaited<ReturnType<typeof getDashboardContext>>["ctx"]>) {
  const admin = createAdminClient();
  let query = admin
    .from("customers")
    .select(`*, agent:users!assigned_agent_id(id, full_name, email)`)
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);

  if (!ctx.isManager) query = query.eq("assigned_agent_id", ctx.userId);
  return query.single();
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { data, error: dbError } = await getCustomer(params.id, ctx);
  if (dbError || !data) return apiError("NOT_FOUND", "Customer not found", 404);
  return apiSuccess(data);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") return apiError("FORBIDDEN", "Cannot edit", 403);

  const parsed = customerUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return validationApiError(parsed);
  }

  const admin = createAdminClient();
  const { data: before } = await getCustomer(params.id, ctx);
  if (!before) return apiError("NOT_FOUND", "Customer not found", 404);

  const { data, error: dbError } = await admin
    .from("customers")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: "customer.updated",
    resourceType: "customer",
    resourceId: params.id,
    beforeState: before as unknown as Record<string, unknown>,
    afterState: data as unknown as Record<string, unknown>,
  });

  return apiSuccess(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Only branch manager can delete", 403);
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("policies")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", params.id)
    .eq("status", "in_force");

  if ((count ?? 0) > 0) {
    return apiError("CONFLICT", "Customer has active policies", 409);
  }

  await admin
    .from("customers")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: "customer.deleted",
    resourceType: "customer",
    resourceId: params.id,
  });

  return apiSuccess({ ok: true });
}
