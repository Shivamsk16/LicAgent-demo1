import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCustomerCode } from "@/lib/business/customer-code";
import { customerSchema } from "@/lib/utils/validators";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const kyc = searchParams.get("kyc_status");
  const sort = searchParams.get("sort") ?? "recent";

  const admin = createAdminClient();
  let query = admin
    .from("customers")
    .select(`*, agent:users!assigned_agent_id(id, full_name)`)
    .eq("tenant_id", ctx.tenantId);

  if (!ctx.isManager) query = query.eq("assigned_agent_id", ctx.userId);
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,pan_number.ilike.%${search}%`
    );
  }
  if (kyc && kyc !== "all") query = query.eq("kyc_status", kyc);

  if (sort === "name") query = query.order("full_name");
  else query = query.order("created_at", { ascending: false });

  const { data, error: dbError } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);
  return apiSuccess(data);
}

export async function POST(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") return apiError("FORBIDDEN", "Viewers cannot create customers", 403);

  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid",
      400
    );
  }

  const admin = createAdminClient();
  const customerCode = await generateCustomerCode(
    ctx.tenantId,
    ctx.tenant.branch_code
  );

  const { data, error: dbError } = await admin
    .from("customers")
    .insert({
      ...parsed.data,
      tenant_id: ctx.tenantId,
      assigned_agent_id: ctx.userId,
      customer_code: customerCode,
      email: parsed.data.email || null,
      alternate_phone: parsed.data.alternate_phone || null,
      pan_number: parsed.data.pan_number || null,
      aadhaar_last4: parsed.data.aadhaar_last4 || null,
    })
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: "customer.created",
    resourceType: "customer",
    resourceId: data.id,
    afterState: data as unknown as Record<string, unknown>,
  });

  return apiSuccess(data, 201);
}
