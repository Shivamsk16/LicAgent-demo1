import { addYears } from "date-fns";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { policySchema } from "@/lib/utils/validators";
import { logAction } from "@/lib/audit";
import { generateReminders } from "@/lib/business/reminders";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const admin = createAdminClient();
  let query = admin
    .from("policies")
    .select(
      `*, customer:customers(id, full_name, phone), agent:users!agent_id(full_name)`
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

  query = query.order("created_at", { ascending: false });
  const { data, error: dbError } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);
  return apiSuccess(data);
}

export async function POST(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") return apiError("FORBIDDEN", "Cannot create policy", 403);

  const parsed = policySchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid",
      400
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("policies")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("policy_number", parsed.data.policy_number)
    .maybeSingle();

  if (existing) {
    return apiError("CONFLICT", "Policy number already exists", 409);
  }

  let maturity = parsed.data.maturity_date;
  if (!maturity && parsed.data.policy_term_years) {
    maturity = addYears(
      new Date(parsed.data.commencement_date),
      parsed.data.policy_term_years
    )
      .toISOString()
      .slice(0, 10);
  }

  const { data, error: dbError } = await admin
    .from("policies")
    .insert({
      ...parsed.data,
      tenant_id: ctx.tenantId,
      agent_id: ctx.userId,
      status: "in_force",
      next_premium_due: parsed.data.commencement_date,
      maturity_date: maturity ?? null,
      rider_details: parsed.data.rider_details ?? [],
    })
    .select(`*, customer:customers(id, full_name)`)
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await generateReminders({
    policyId: data.id,
    nextDueDate: parsed.data.commencement_date,
    tenantId: ctx.tenantId,
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
