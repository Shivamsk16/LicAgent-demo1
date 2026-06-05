import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status") ?? "pending";

  const admin = createAdminClient();
  let query = admin
    .from("premium_reminders")
    .select(
      `*,
       policy:policies(policy_number, plan_name, premium_amount, status),
       customer:customers(full_name, phone)`
    )
    .eq("tenant_id", ctx.tenantId)
    .order("due_date", { ascending: true });

  if (!ctx.isManager) query = query.eq("agent_id", ctx.userId);
  if (status !== "all") query = query.in("status", status.split(","));
  if (from) query = query.gte("due_date", from);
  if (to) query = query.lte("due_date", to);

  const { data, error: dbError } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);
  return apiSuccess(data);
}
