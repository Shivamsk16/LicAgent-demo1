import { createAdminClient } from "@/lib/supabase/admin";

export type MembershipRow = {
  tenant_id: string;
  status: string;
  roles: { name: string } | { name: string }[] | null;
};

/** Service-role lookup — RLS on tenant_members blocks the anon client (self-referential policy). */
export async function getActiveMemberships(
  userId: string
): Promise<MembershipRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_members")
    .select("tenant_id, status, roles(name)")
    .eq("user_id", userId)
    .eq("status", "active");
  return (data ?? []) as MembershipRow[];
}

export function membershipRole(membership: MembershipRow): string {
  const rolesRaw = membership.roles;
  return (
    (Array.isArray(rolesRaw) ? rolesRaw[0]?.name : rolesRaw?.name) ?? ""
  );
}
