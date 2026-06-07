import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordPayment } from "@/lib/business/record-payment";
import { paymentSchema } from "@/lib/utils/validators";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  applySort,
  paginated,
  parseListParams,
  type FilterableQuery,
} from "@/lib/api/list-params";
import { fetchPolicyForContext } from "@/lib/auth/policy-access";

const SORT_COLUMNS = {
  payment_date: "payment_date",
  amount_paid: "amount_paid",
  installment_number: "installment_number",
  due_date: "due_date",
  status: "status",
};

function applyPaymentFilters(
  query: FilterableQuery,
  ctx: NonNullable<Awaited<ReturnType<typeof getDashboardContext>>["ctx"]>,
  params: URLSearchParams
): FilterableQuery {
  const status = params.get("status");
  const from = params.get("from");
  const to = params.get("to");
  const agentId = params.get("agent_id");
  const customerId = params.get("customer_id");
  const policyId = params.get("policy_id");
  const search = params.get("search")?.trim();

  if (!ctx.isManager) query = query.eq("recorded_by", ctx.userId);
  else if (agentId) query = query.eq("recorded_by", agentId);
  if (status && status !== "all") query = query.eq("status", status);
  if (from) query = query.gte("payment_date", from);
  if (to) query = query.lte("payment_date", to);
  if (customerId) query = query.eq("customer_id", customerId);
  if (policyId) query = query.eq("policy_id", policyId);
  if (search) query = query.ilike("receipt_number", `%${search}%`);

  return query;
}

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams, { defaultSort: "payment_date", defaultOrder: "desc" });
  const admin = createAdminClient();

  let countQuery = admin
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId);
  countQuery = applyPaymentFilters(countQuery, ctx, searchParams);

  let dataQuery = admin
    .from("payments")
    .select(
      `*, policy:policies(policy_number, plan_name),
       customer:customers(full_name),
       recorder:users!recorded_by(full_name)`,
      { count: "exact" }
    )
    .eq("tenant_id", ctx.tenantId);
  dataQuery = applyPaymentFilters(dataQuery, ctx, searchParams);
  dataQuery = applySort(dataQuery, list.sort, list.order, SORT_COLUMNS);
  dataQuery = dataQuery.range(list.offset, list.offset + list.pageSize - 1);

  const [{ count: total }, { data, error: dbError }] = await Promise.all([
    countQuery,
    dataQuery,
  ]);
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  let summaryQuery = admin
    .from("payments")
    .select("amount_paid, late_fee, status")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "paid");
  summaryQuery = applyPaymentFilters(summaryQuery, ctx, searchParams);
  const { data: summaryRows } = await summaryQuery.limit(5000);

  const totalCollected = (summaryRows ?? []).reduce(
    (s, p) => s + Number(p.amount_paid) + Number(p.late_fee ?? 0),
    0
  );

  return apiSuccess({
    ...paginated(data ?? [], total ?? 0, list.page, list.pageSize),
    summary: { totalCollected },
  });
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

  const admin = createAdminClient();
  const policy = await fetchPolicyForContext(
    admin,
    parsed.data.policy_id,
    ctx
  );
  if (!policy) {
    return apiError("NOT_FOUND", "Policy not found", 404);
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
