import { addYears } from "date-fns";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { policySchema } from "@/lib/utils/validators";
import { logAction } from "@/lib/audit";
import { generateReminders } from "@/lib/business/reminders";
import { apiError, apiSuccess } from "@/lib/api/response";
import { applySort, paginated, parseListParams } from "@/lib/api/list-params";

const SORT_COLUMNS = {
  policy_number: "policy_number",
  created_at: "created_at",
  premium_amount: "premium_amount",
  next_premium_due: "next_premium_due",
  status: "status",
  plan_name: "plan_name",
};

function buildPolicyQuery(
  admin: ReturnType<typeof createAdminClient>,
  ctx: NonNullable<Awaited<ReturnType<typeof getDashboardContext>>["ctx"]>,
  params: URLSearchParams
) {
  const customerId = params.get("customer_id");
  const status = params.get("status");
  const search = params.get("search");

  let query = admin
    .from("policies")
    .select(
      `*, customer:customers(id, full_name, phone), agent:users!agent_id(full_name)`,
      { count: "exact" }
    )
    .eq("tenant_id", ctx.tenantId);

  if (!ctx.isManager) query = query.eq("agent_id", ctx.userId);
  if (customerId) query = query.eq("customer_id", customerId);
  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(
      `policy_number.ilike.%${search}%,plan_name.ilike.%${search}%`
    );
  }

  return query;
}

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams, { defaultSort: "created_at", defaultOrder: "desc" });
  const admin = createAdminClient();

  let query = buildPolicyQuery(admin, ctx, searchParams);
  query = applySort(query, list.sort, list.order, SORT_COLUMNS);
  query = query.range(list.offset, list.offset + list.pageSize - 1);

  const { data, error: dbError, count } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);
  return apiSuccess(paginated(data ?? [], count ?? 0, list.page, list.pageSize));
}

export async function POST(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") return apiError("FORBIDDEN", "Cannot create policy", 403);

  const body = await request.json();
  const parsed = policySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid",
      400
    );
  }

  const admin = createAdminClient();
  const maturity =
    parsed.data.maturity_date ??
    addYears(
      new Date(parsed.data.commencement_date),
      parsed.data.policy_term_years ?? 20
    )
      .toISOString()
      .slice(0, 10);

  const { data, error: dbError } = await admin
    .from("policies")
    .insert({
      ...parsed.data,
      tenant_id: ctx.tenantId,
      agent_id: ctx.userId,
      maturity_date: maturity,
      status: "in_force",
      next_premium_due: parsed.data.commencement_date,
    })
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await generateReminders({
    tenantId: ctx.tenantId,
    policyId: data.id,
    nextDueDate: parsed.data.commencement_date,
    customerId: parsed.data.customer_id,
    agentId: ctx.userId,
  });

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: "policy.created",
    resourceType: "policy",
    resourceId: data.id,
    afterState: data as unknown as Record<string, unknown>,
  });

  return apiSuccess(data, 201);
}
