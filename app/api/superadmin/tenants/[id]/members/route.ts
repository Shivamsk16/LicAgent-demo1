import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { sendInvitationEmail } from "@/lib/integrations/resend";
import { getInviteCompleteUrl, getInviteTokenUrl } from "@/lib/auth/app-url";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSuperAdmin();
  if (error) return apiError(error, "Access denied", error === "UNAUTHORIZED" ? 401 : 403);

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("tenant_members")
    .select(
      `*, user:users(id, email, full_name, phone), role:roles(id, name, display_name)`
    )
    .eq("tenant_id", params.id)
    .neq("status", "removed")
    .order("invited_at", { ascending: false });

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);
  return apiSuccess(data);
}

const inviteSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role_name: z.enum(["senior_agent", "agent", "viewer", "branch_manager"]),
  employee_id: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid input", 400);
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("name, max_agents")
    .eq("id", params.id)
    .single();

  if (!tenant) return apiError("NOT_FOUND", "Branch not found", 404);

  const { count } = await admin
    .from("tenant_members")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", params.id)
    .in("status", ["active", "invited"]);

  if ((count ?? 0) >= tenant.max_agents) {
    return apiError("CONFLICT", "Max agents limit reached", 409);
  }

  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("tenant_id", params.id)
    .eq("name", parsed.data.role_name)
    .single();

  if (!role) return apiError("NOT_FOUND", "Role not found", 404);

  let userId: string;
  const email = parsed.data.email.toLowerCase();
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: authUser, error: authError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: parsed.data.full_name },
        redirectTo: getInviteCompleteUrl(),
      });
    if (authError || !authUser.user) {
      return apiError("SERVER_ERROR", authError?.message ?? "Invite failed", 500);
    }
    userId = authUser.user.id;
    await admin.from("users").insert({
      id: userId,
      email,
      full_name: parsed.data.full_name,
      super_admin: false,
    });
  }

  const { data: invitation, error: invError } = await admin
    .from("invitations")
    .insert({
      tenant_id: params.id,
      invited_by: user.id,
      role_id: role.id,
      email,
    })
    .select("token")
    .single();

  if (invError) return apiError("SERVER_ERROR", invError.message, 500);

  await admin.from("tenant_members").upsert(
    {
      user_id: userId,
      tenant_id: params.id,
      role_id: role.id,
      employee_id: parsed.data.employee_id ?? null,
      status: "invited",
    },
    { onConflict: "user_id,tenant_id" }
  );

  const inviteUrl = getInviteTokenUrl(invitation!.token);
  await sendInvitationEmail({
    to: email,
    managerName: parsed.data.full_name,
    branchName: tenant.name,
    inviteUrl,
  });

  await logAction({
    actorId: user.id,
    tenantId: params.id,
    action: "member.invited",
    resourceType: "tenant_member",
    afterState: { email, role: parsed.data.role_name },
  });

  return apiSuccess({ invitation }, 201);
}
