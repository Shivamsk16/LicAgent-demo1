import { getDashboardContext } from "@/lib/auth/dashboard-context";
import {
  initiateRevival,
  calculateRevivalCosts,
  approveRevival,
} from "@/lib/business/revival";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { format } from "date-fns";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const admin = createAdminClient();
  const { data: policy } = await admin
    .from("policies")
    .select("*")
    .eq("id", params.id)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!policy || policy.status !== "lapsed") {
    return apiError("NOT_FOUND", "Lapsed policy not found", 404);
  }

  const costs = calculateRevivalCosts({
    premiumAmount: Number(policy.premium_amount),
    lapsedOn: policy.lapsed_on ?? format(new Date(), "yyyy-MM-dd"),
    premiumFrequency: policy.premium_frequency,
  });

  const { data: pending } = await admin
    .from("policy_revivals")
    .select("*")
    .eq("policy_id", params.id)
    .eq("status", "pending")
    .maybeSingle();

  return apiSuccess({ policy, costs, pendingRevival: pending });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") return apiError("FORBIDDEN", "Cannot initiate revival", 403);

  const body = await request.json();
  const result = await initiateRevival({
    tenantId: ctx.tenantId,
    policyId: params.id,
    userId: ctx.userId,
    ...body,
  });

  if ("error" in result && result.error) {
    return apiError("CONFLICT", result.error, 409);
  }

  return apiSuccess(result, 201);
}

export async function PATCH(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Only branch manager can approve revival", 403);
  }

  const { revivalId, approve, rejectionReason } = await request.json();
  const result = await approveRevival({
    revivalId,
    tenantId: ctx.tenantId,
    approverId: ctx.userId,
    approve: approve === true,
    rejectionReason,
  });

  if ("error" in result && result.error) {
    return apiError("CONFLICT", result.error, 409);
  }

  return apiSuccess(result);
}
