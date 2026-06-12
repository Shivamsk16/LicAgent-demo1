import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCustomerCode } from "@/lib/business/customer-code";
import { customerSchema } from "@/lib/utils/validators";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";
import { validationApiError } from "@/lib/api/zod-error";
import { applySort, paginated, parseListParams } from "@/lib/api/list-params";

const SORT_COLUMNS = {
  full_name: "full_name",
  created_at: "created_at",
  customer_code: "customer_code",
  phone: "phone",
  city: "city",
  kyc_status: "kyc_status",
};

const DEDUPE_WINDOW_MS = 5_000;

function buildCustomerQuery(
  admin: ReturnType<typeof createAdminClient>,
  ctx: NonNullable<Awaited<ReturnType<typeof getDashboardContext>>["ctx"]>,
  params: URLSearchParams
) {
  const search = params.get("search") ?? "";
  const kyc = params.get("kyc_status");
  const agent = params.get("agent");

  let query = admin
    .from("customers")
    .select(`*, agent:users!assigned_agent_id(id, full_name)`, { count: "exact" })
    .eq("tenant_id", ctx.tenantId)
    .eq("is_active", true);

  if (!ctx.isManager) {
    query = query.eq("assigned_agent_id", ctx.userId);
  } else if (agent) {
    query = query.eq("assigned_agent_id", agent);
  }
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,pan_number.ilike.%${search}%`
    );
  }
  if (kyc && kyc !== "all") query = query.eq("kyc_status", kyc);

  return query;
}

async function findRecentDuplicate(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  userId: string,
  phone: string,
  fullName: string
) {
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
  const { data } = await admin
    .from("customers")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .eq("full_name", fullName)
    .eq("assigned_agent_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function findSubmissionCustomer(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  submissionId: string
) {
  const { data: submission } = await admin
    .from("customer_submissions")
    .select("customer_id")
    .eq("tenant_id", tenantId)
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (!submission?.customer_id) return null;

  const { data: customer } = await admin
    .from("customers")
    .select("*")
    .eq("id", submission.customer_id)
    .maybeSingle();

  return customer;
}

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams, { defaultSort: "created_at", defaultOrder: "desc" });
  const admin = createAdminClient();

  let query = buildCustomerQuery(admin, ctx, searchParams);
  query = applySort(query, list.sort, list.order, SORT_COLUMNS);
  query = query.range(list.offset, list.offset + list.pageSize - 1);

  const { data, error: dbError, count } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  return apiSuccess(paginated(data ?? [], count ?? 0, list.page, list.pageSize));
}

export async function POST(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") return apiError("FORBIDDEN", "Viewers cannot create customers", 403);

  const submissionId = request.headers.get("X-Submission-Id")?.trim();
  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return validationApiError(parsed);
  }

  const admin = createAdminClient();

  if (submissionId) {
    const existing = await findSubmissionCustomer(
      admin,
      ctx.tenantId,
      submissionId
    );
    if (existing) {
      return apiSuccess(existing, 200, { duplicate: true });
    }
  }

  const recentDuplicate = await findRecentDuplicate(
    admin,
    ctx.tenantId,
    ctx.userId,
    parsed.data.phone,
    parsed.data.full_name
  );
  if (recentDuplicate) {
    if (submissionId) {
      await admin.from("customer_submissions").upsert(
        {
          tenant_id: ctx.tenantId,
          submission_id: submissionId,
          customer_id: recentDuplicate.id,
        },
        { onConflict: "tenant_id,submission_id" }
      );
    }
    return apiSuccess(recentDuplicate, 200, { duplicate: true });
  }

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

  if (submissionId) {
    await admin.from("customer_submissions").insert({
      tenant_id: ctx.tenantId,
      submission_id: submissionId,
      customer_id: data.id,
    });
  }

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
