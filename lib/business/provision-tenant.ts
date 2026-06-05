import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { sendInvitationEmail } from "@/lib/integrations/resend";
import { getInviteCompleteUrl, getInviteTokenUrl } from "@/lib/auth/app-url";
import {
  ROLE_DISPLAY_NAMES,
  ROLE_PERMISSIONS,
  SYSTEM_ROLES,
} from "@/lib/constants/roles";
import { slugify } from "@/lib/utils/dates";
import type { ProvisionBranchInput } from "@/types/database";

const PLAN_MRR: Record<string, number> = {
  trial: 0,
  starter: 2999,
  pro: 5999,
  enterprise: 14999,
};

export function getPlanMRR(plan: string, billingCycle: string) {
  const monthly = PLAN_MRR[plan] ?? 0;
  return billingCycle === "yearly" ? Math.round(monthly * 12 * 0.9) / 12 : monthly;
}

export async function provisionBranch(
  input: ProvisionBranchInput,
  actorId: string
) {
  const admin = createAdminClient();
  const slug = slugify(input.name);
  const trialEnds =
    input.plan === "trial"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data: existingSlug } = await admin
    .from("tenants")
    .select("id")
    .or(`slug.eq.${slug},branch_code.eq.${input.branch_code}`)
    .maybeSingle();

  if (existingSlug) {
    return { error: "Branch name or code already exists" };
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name: input.name,
      slug,
      branch_code: input.branch_code,
      city: input.city,
      state: input.state,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      plan: input.plan,
      status: "pending",
      trial_ends_at: trialEnds,
      max_agents: input.max_agents,
      billing_cycle: input.billing_cycle,
    })
    .select()
    .single();

  if (tenantError || !tenant) {
    return { error: tenantError?.message ?? "Failed to create tenant" };
  }

  const roleRows = SYSTEM_ROLES.map((name) => ({
    tenant_id: tenant.id,
    name,
    display_name: ROLE_DISPLAY_NAMES[name],
    permissions: ROLE_PERMISSIONS[name],
    is_system_role: true,
  }));

  const { data: roles, error: rolesError } = await admin
    .from("roles")
    .insert(roleRows)
    .select();

  if (rolesError || !roles) {
    await admin.from("tenants").delete().eq("id", tenant.id);
    return { error: rolesError?.message ?? "Failed to seed roles" };
  }

  const managerRole = roles.find((r) => r.name === "branch_manager");
  if (!managerRole) {
    return { error: "Branch manager role not created" };
  }

  let userId: string;
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("email", input.manager_email.toLowerCase())
    .maybeSingle();

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: authUser, error: authError } =
      await admin.auth.admin.inviteUserByEmail(input.manager_email, {
        data: { full_name: input.manager_name },
        redirectTo: getInviteCompleteUrl(),
      });

    if (authError || !authUser.user) {
      await admin.from("tenants").delete().eq("id", tenant.id);
      return { error: authError?.message ?? "Failed to invite manager" };
    }

    userId = authUser.user.id;

    await admin.from("users").insert({
      id: userId,
      email: input.manager_email.toLowerCase(),
      full_name: input.manager_name,
      phone: input.manager_phone,
      super_admin: false,
      email_verified: false,
    });
  }

  const { data: member, error: memberError } = await admin
    .from("tenant_members")
    .insert({
      user_id: userId,
      tenant_id: tenant.id,
      role_id: managerRole.id,
      employee_id: input.manager_employee_id ?? null,
      status: "invited",
    })
    .select()
    .single();

  if (memberError) {
    return { error: memberError.message };
  }

  const { data: invitation, error: invError } = await admin
    .from("invitations")
    .insert({
      tenant_id: tenant.id,
      invited_by: actorId,
      role_id: managerRole.id,
      email: input.manager_email.toLowerCase(),
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    })
    .select("token")
    .single();

  if (invError || !invitation) {
    return { error: invError?.message ?? "Failed to create invitation" };
  }

  await admin
    .from("tenants")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", tenant.id);

  const inviteUrl = getInviteTokenUrl(invitation.token);
  await sendInvitationEmail({
    to: input.manager_email,
    managerName: input.manager_name,
    branchName: input.name,
    inviteUrl,
  });

  await logAction({
    actorId,
    tenantId: tenant.id,
    action: "tenant.created",
    resourceType: "tenant",
    resourceId: tenant.id,
    afterState: { tenant, member },
  });

  return { tenant: { ...tenant, status: "active" }, invitation };
}
