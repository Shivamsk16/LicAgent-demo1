import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcLateFee } from "@/lib/business/payments";
import { apiError, apiSuccess } from "@/lib/api/response";
import { fetchPolicyForContext } from "@/lib/auth/policy-access";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const policyId = new URL(request.url).searchParams.get("policy_id");
  if (!policyId) return apiError("VALIDATION_ERROR", "policy_id required", 400);

  const admin = createAdminClient();
  const policy = await fetchPolicyForContext(admin, policyId, ctx);
  if (!policy) return apiError("NOT_FOUND", "Policy not found", 404);

  const { data: fullPolicy } = await admin
    .from("policies")
    .select("*")
    .eq("id", policyId)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!fullPolicy) return apiError("NOT_FOUND", "Policy not found", 404);

  const { data: lastPayment } = await admin
    .from("payments")
    .select("installment_number")
    .eq("policy_id", policyId)
    .in("status", ["paid", "partial"])
    .order("installment_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const installment = (lastPayment?.installment_number ?? 0) + 1;
  const dueDate = fullPolicy.next_premium_due ?? fullPolicy.commencement_date;
  const today = new Date().toISOString().slice(0, 10);
  const lateFee = calcLateFee(
    Number(fullPolicy.premium_amount),
    dueDate,
    today
  );

  return apiSuccess({
    installment_number: installment,
    due_date: dueDate,
    amount_due: fullPolicy.premium_amount,
    late_fee: lateFee,
    policy_status: fullPolicy.status,
  });
}
