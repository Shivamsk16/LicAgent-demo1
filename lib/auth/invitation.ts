import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications/create";

export interface InvitationDetails {
  id: string;
  token: string;
  email: string;
  status: string;
  expires_at: string;
  tenant_id: string;
  role_id: string | null;
  tenant?: { name: string; city: string | null; state: string | null };
  role?: { name: string; display_name: string | null };
}

export async function getInvitationByToken(
  token: string
): Promise<{ invitation: InvitationDetails | null; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select(
      `id, token, email, status, expires_at, tenant_id, role_id,
       tenant:tenants(name, city, state),
       role:roles(name, display_name)`
    )
    .eq("token", token)
    .maybeSingle();

  if (error) return { invitation: null, error: error.message };
  if (!data) return { invitation: null, error: "Invitation not found" };

  return { invitation: data as unknown as InvitationDetails };
}

export function validateInvitation(inv: InvitationDetails): string | null {
  if (inv.status === "accepted") return "This invitation has already been accepted.";
  if (inv.status === "revoked") return "This invitation was revoked.";
  if (inv.status === "expired") return "This invitation has expired.";
  if (new Date(inv.expires_at) < new Date()) return "This invitation has expired.";
  return null;
}

export async function activateMembershipForUser(params: {
  userId: string;
  email: string;
  invitationToken?: string;
  actorId?: string;
}) {
  const admin = createAdminClient();
  const email = params.email.toLowerCase();
  let tenantId: string | null = null;

  if (params.invitationToken) {
    const { invitation, error } = await getInvitationByToken(params.invitationToken);
    if (error || !invitation) return { error: error ?? "Invitation not found" };

    const validation = validateInvitation(invitation);
    if (validation) return { error: validation };

    if (invitation.email.toLowerCase() !== email) {
      return { error: "Invitation email does not match signed-in account" };
    }

    tenantId = invitation.tenant_id;

    await admin
      .from("invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    await admin
      .from("tenant_members")
      .update({
        status: "active",
        joined_at: new Date().toISOString(),
        suspended_at: null,
        suspended_reason: null,
      })
      .eq("user_id", params.userId)
      .eq("tenant_id", invitation.tenant_id);
  } else {
    const { data: pendingInvites } = await admin
      .from("invitations")
      .select("id, tenant_id")
      .eq("email", email)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());

    for (const inv of pendingInvites ?? []) {
      await admin
        .from("invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", inv.id);
    }

    const { data: memberships } = await admin
      .from("tenant_members")
      .update({
        status: "active",
        joined_at: new Date().toISOString(),
        suspended_at: null,
        suspended_reason: null,
      })
      .eq("user_id", params.userId)
      .eq("status", "invited")
      .select("tenant_id");

    tenantId = memberships?.[0]?.tenant_id ?? pendingInvites?.[0]?.tenant_id ?? null;
  }

  await admin
    .from("users")
    .update({
      email_verified: true,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.userId);

  if (tenantId) {
    await logAction({
      actorId: params.actorId ?? params.userId,
      tenantId,
      action: "invitation.accepted",
      resourceType: "invitation",
      afterState: { email, userId: params.userId },
    });

    const { data: tenant } = await admin
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .single();

    await createNotification({
      tenantId,
      userId: params.userId,
      type: "team_update",
      title: `Welcome to ${tenant?.name ?? "your branch"}`,
      body: "Your account is active. Start managing policies and customers.",
      link: "/dashboard",
    });
  }

  return { success: true, tenantId };
}
