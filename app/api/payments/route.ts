import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordPayment } from "@/lib/business/record-payment";
import { paymentSchema } from "@/lib/utils/validators";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const agentId = searchParams.get("agent_id");

  const admin = createAdminClient();
  let query = admin
    .from("payments")
    .select(
      `*, policy:policies(policy_number, plan_name),
       customer:customers(full_name),
       recorder:users!recorded_by(full_name)`
    )
    .eq("tenant_id", ctx.tenantId)
    .order("payment_date", { ascending: false });

  if (!ctx.isManager) query = query.eq("recorded_by", ctx.userId);
  else if (agentId) query = query.eq("recorded_by", agentId);
  if (status && status !== "all") query = query.eq("status", status);
  if (from) query = query.gte("payment_date", from);
  if (to) query = query.lte("payment_date", to);

  const { data, error: dbError } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  const totalCollected = (data ?? [])
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount_paid) + Number(p.late_fee ?? 0), 0);

  return apiSuccess({ payments: data, summary: { totalCollected } });
}

export async function POST(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") return apiError("FORBIDDEN", "Cannot record payment", 403);

  const parsed = paymentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid",
      400
    );
  }

  const result = await recordPayment({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    policyId: parsed.data.policy_id,
    paymentDate: parsed.data.payment_date,
    dueDate: parsed.data.due_date,
    amountDue: parsed.data.amount_due,
    amountPaid: parsed.data.amount_paid,
    installmentNumber: parsed.data.installment_number,
    paymentMode: parsed.data.payment_mode,
    receiptNumber: parsed.data.receipt_number,
    remarks: parsed.data.remarks,
    lateFee: parsed.data.late_fee,
  });

  if ("error" in result && result.error) {
    return apiError("CONFLICT", result.error, 409);
  }

  return apiSuccess(result.payment, 201);
}
