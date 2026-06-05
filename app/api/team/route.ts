import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteTenantMember } from "@/lib/business/invite-member";
import { apiError, apiSuccess } from "@/lib/api/response";
import { z } from "zod";
import { format } from "date-fns";

export async function GET() {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Branch manager only", 403);
  }

  const admin = createAdminClient();
  const { data: members, error: dbError } = await admin
    .from("tenant_members")
    .select(
      `*, user:users(id, email, full_name, phone), role:roles(id, name, display_name)`
    )
    .eq("tenant_id", ctx.tenantId)
    .neq("status", "removed")
    .order("invited_at", { ascending: false });

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  const monthKey = format(new Date(), "yyyy-MM");
  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const uid = m.user_id;
      const { count: customers } = await admin
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .eq("assigned_agent_id", uid);

      const { count: policies } = await admin
        .from("policies")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .eq("agent_id", uid)
        .eq("status", "in_force");

      const { data: comm } = await admin
        .from("commissions")
        .select("net_commission")
        .eq("tenant_id", ctx.tenantId)
        .eq("agent_id", uid)
        .eq("month", monthKey);

      const commissionMonth = (comm ?? []).reduce(
        (s, c) => s + Number(c.net_commission),
        0
      );

      return { ...m, stats: { customers: customers ?? 0, policies: policies ?? 0, commissionMonth } };
    })
  );

  const stats = {
    total: enriched.length,
    active: enriched.filter((m) => m.status === "active").length,
    invited: enriched.filter((m) => m.status === "invited").length,
    suspended: enriched.filter((m) => m.status === "suspended").length,
  };

  return apiSuccess({ members: enriched, stats });
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
