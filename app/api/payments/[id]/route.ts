import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const admin = createAdminClient();
  let query = admin
    .from("payments")
    .select(
      `*, policy:policies(policy_number, plan_name, premium_amount),
       customer:customers(full_name, phone, customer_code),
       recorder:users!recorded_by(full_name)`
    )
    .eq("id", params.id)
    .eq("tenant_id", ctx.tenantId);

  if (!ctx.isManager) query = query.eq("recorded_by", ctx.userId);

  const { data, error: dbError } = await query.single();
  if (dbError || !data) return apiError("NOT_FOUND", "Payment not found", 404);
  return apiSuccess(data);
}
