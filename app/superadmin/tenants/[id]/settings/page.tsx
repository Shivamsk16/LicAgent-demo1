import { TenantSettingsForm } from "@/components/superadmin/tenant-settings-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function TenantSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!tenant) notFound();

  return <TenantSettingsForm tenant={tenant} />;
}
