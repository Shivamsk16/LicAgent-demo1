import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { sendInvitationEmail } from "@/lib/integrations/resend";
import { getInviteCompleteUrl, getInviteTokenUrl } from "@/lib/auth/app-url";
export async function inviteTenantMember(params: {
  tenantId: string;
  tenantName: string;
  invitedBy: string;
  fullName: string;
  email: string;
  roleName: "senior_agent" | "agent" | "viewer";
  employeeId?: string;
  maxAgents: number;
}) {
  const admin = createAdminClient();
  const email = params.email.toLowerCase();

  const { count } = await admin
    .from("tenant_members")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", params.tenantId)
    .in("status", ["active", "invited"]);

  if ((count ?? 0) >= params.maxAgents) {
    return { error: "Max agents limit reached for this branch" };
  }

  const { data: role } = await admin
    .from("roles")
    .select("id")
    .eq("tenant_id", params.tenantId)
    .eq("name", params.roleName)
    .single();

  if (!role) return { error: "Role not found" };

  let userId: string;
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
        data: { full_name: params.fullName },
        redirectTo: getInviteCompleteUrl(),
      });
    if (authError || !authUser.user) {
      return { error: authError?.message ?? "Failed to send invite" };
    }
    userId = authUser.user.id;
    await admin.from("users").upsert({
      id: userId,
      email,
      full_name: params.fullName,
      super_admin: false,
    });
  }

  const { data: invitation, error: invError } = await admin
    .from("invitations")
    .insert({
      tenant_id: params.tenantId,
      invited_by: params.invitedBy,
      role_id: role.id,
      email,
    })
    .select("token")
    .single();

  if (invError || !invitation) {
    return { error: invError?.message ?? "Failed to create invitation" };
  }

  await admin.from("tenant_members").upsert(
    {
      user_id: userId,
      tenant_id: params.tenantId,
      role_id: role.id,
      employee_id: params.employeeId ?? null,
      status: "invited",
    },
    { onConflict: "user_id,tenant_id" }
  );

  const inviteUrl = getInviteTokenUrl(invitation.token);
  await sendInvitationEmail({
    to: email,
    managerName: params.fullName,
    branchName: params.tenantName,
    inviteUrl,
  });

  await logAction({
    actorId: params.invitedBy,
    tenantId: params.tenantId,
    action: "member.invited",
    resourceType: "tenant_member",
    afterState: { email, role: params.roleName },
  });

  return { inviteUrl, token: invitation.token };
}
