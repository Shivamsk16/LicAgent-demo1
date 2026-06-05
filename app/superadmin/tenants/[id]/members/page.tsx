import { TenantMembersTable } from "@/components/superadmin/tenant-members-table";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TenantMembersPage({
  params,
}: {
  params: { id: string };
}) {
  let members: unknown[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("tenant_members")
      .select(
        `*, user:users(id, email, full_name, phone), role:roles(id, name, display_name)`
      )
      .eq("tenant_id", params.id)
      .neq("status", "removed")
      .order("invited_at", { ascending: false });
    members = data ?? [];
  } catch {
    /* Supabase not configured */
  }

  return (
    <TenantMembersTable
      tenantId={params.id}
      members={members as Parameters<typeof TenantMembersTable>[0]["members"]}
    />
  );
}
