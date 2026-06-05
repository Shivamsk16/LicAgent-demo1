import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInvitationEmail } from "@/lib/integrations/resend";
import { getInviteTokenUrl } from "@/lib/auth/app-url";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Branch manager only", 403);
  }

  const { memberId } = await params;
  const admin = createAdminClient();

  const { data: member } = await admin
    .from("tenant_members")
    .select("*, user:users(email, full_name), role:roles(id)")
    .eq("id", memberId)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!member || member.status !== "invited") {
    return apiError("BAD_REQUEST", "Member is not in invited status", 400);
  }

  const userRaw = member.user as { email: string; full_name: string } | { email: string; full_name: string }[] | null;
  const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;
  if (!user?.email) return apiError("NOT_FOUND", "User email not found", 404);

  const roleRaw = member.role as { id: string } | { id: string }[] | null;
  const roleId = Array.isArray(roleRaw) ? roleRaw[0]?.id : roleRaw?.id;

  const { data: invitation } = await admin
    .from("invitations")
    .insert({
      tenant_id: ctx.tenantId,
      invited_by: ctx.userId,
      role_id: roleId,
      email: user.email,
    })
    .select("token")
    .single();

  if (!invitation) return apiError("SERVER_ERROR", "Failed to create invitation", 500);

  const inviteUrl = getInviteTokenUrl(invitation.token);
  await sendInvitationEmail({
    to: user.email,
    managerName: user.full_name,
    branchName: ctx.tenant.name,
    inviteUrl,
  });

  return apiSuccess({ inviteUrl });
}
