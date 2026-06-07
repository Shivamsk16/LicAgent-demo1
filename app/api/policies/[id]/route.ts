import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { policySchema } from "@/lib/utils/validators";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  fetchCustomerInTenant,
  fetchPolicyForContext,
} from "@/lib/auth/policy-access";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const admin = createAdminClient();
  let query = admin
    .from("policies")
    .select(
      `*, customer:customers(id, full_name, phone, customer_code),
       agent:users!agent_id(id, full_name),
       payments(*)`
    )
    .eq("id", params.id)
    .eq("tenant_id", ctx.tenantId);

  if (!ctx.isManager) query = query.eq("agent_id", ctx.userId);

  const { data, error: dbError } = await query.single();
  if (dbError || !data) return apiError("NOT_FOUND", "Policy not found", 404);
  return apiSuccess(data);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") return apiError("FORBIDDEN", "Cannot edit", 403);

  const body = await request.json();
  const parsed = policySchema.partial().safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid", 400);

  const admin = createAdminClient();
  const existing = await fetchPolicyForContext(admin, params.id, ctx);
  if (!existing) return apiError("NOT_FOUND", "Policy not found", 404);

  if (parsed.data.customer_id) {
    const customer = await fetchCustomerInTenant(
      admin,
      parsed.data.customer_id,
      ctx.tenantId,
      !ctx.isManager ? { requireAssignedAgentId: ctx.userId } : undefined
    );
    if (!customer) {
      return apiError("NOT_FOUND", "Customer not found", 404);
    }
  }

  const { data, error: dbError } = await admin
    .from("policies")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("tenant_id", ctx.tenantId)
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: "policy.updated",
    resourceType: "policy",
    resourceId: params.id,
    afterState: data as unknown as Record<string, unknown>,
  });

  return apiSuccess(data);
}
