import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteTenantMember } from "@/lib/business/invite-member";
import { apiError, apiSuccess } from "@/lib/api/response";
import { applySort, paginated, parseListParams } from "@/lib/api/list-params";
import { z } from "zod";
import { format } from "date-fns";

const SORT_COLUMNS = {
  invited_at: "invited_at",
  status: "status",
  joined_at: "joined_at",
};

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Branch manager only", 403);
  }

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams, { defaultSort: "invited_at", defaultOrder: "desc" });
  const status = searchParams.get("status");

  const admin = createAdminClient();
  let query = admin
    .from("tenant_members")
    .select(
      `*, user:users(id, email, full_name, phone), role:roles(id, name, display_name)`,
      { count: "exact" }
    )
    .eq("tenant_id", ctx.tenantId)
    .neq("status", "removed");

  if (status && status !== "all") query = query.eq("status", status);

  query = applySort(query, list.sort, list.order, SORT_COLUMNS);
  query = query.range(list.offset, list.offset + list.pageSize - 1);

  const { data: members, error: dbError, count } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  const monthKey = format(new Date(), "yyyy-MM");
  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const uid = m.user_id;
      const [{ count: customers }, { count: policies }, { data: comm }] = await Promise.all([
        admin
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", ctx.tenantId)
          .eq("assigned_agent_id", uid),
        admin
          .from("policies")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", ctx.tenantId)
          .eq("agent_id", uid)
          .eq("status", "in_force"),
        admin
          .from("commissions")
          .select("net_commission")
          .eq("tenant_id", ctx.tenantId)
          .eq("agent_id", uid)
          .eq("month", monthKey),
      ]);

      const commissionMonth = (comm ?? []).reduce(
        (s, c) => s + Number(c.net_commission),
        0
      );

      return { ...m, stats: { customers: customers ?? 0, policies: policies ?? 0, commissionMonth } };
    })
  );

  const { data: allForStats } = await admin
    .from("tenant_members")
    .select("status")
    .eq("tenant_id", ctx.tenantId)
    .neq("status", "removed");

  const stats = {
    total: allForStats?.length ?? 0,
    active: allForStats?.filter((m) => m.status === "active").length ?? 0,
    invited: allForStats?.filter((m) => m.status === "invited").length ?? 0,
    suspended: allForStats?.filter((m) => m.status === "suspended").length ?? 0,
  };

  return apiSuccess({
    ...paginated(enriched, count ?? 0, list.page, list.pageSize),
    stats,
  });
}

const inviteSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role_name: z.enum(["senior_agent", "agent", "viewer"]),
  employee_id: z.string().optional(),
});

export async function POST(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Branch manager only", 403);
  }

  const parsed = inviteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid", 400);
  }

  const result = await inviteTenantMember({
    tenantId: ctx.tenantId,
    tenantName: ctx.tenant.name,
    invitedBy: ctx.userId,
    fullName: parsed.data.full_name,
    email: parsed.data.email,
    roleName: parsed.data.role_name,
    employeeId: parsed.data.employee_id,
    maxAgents: ctx.tenant.max_agents,
  });

  if (result.error) return apiError("SERVER_ERROR", result.error, 400);
  return apiSuccess(result, 201);
}
