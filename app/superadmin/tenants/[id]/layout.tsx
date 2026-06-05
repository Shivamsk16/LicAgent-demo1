import { TenantNav } from "@/components/superadmin/tenant-nav";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function TenantDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  let tenant = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("tenants")
      .select("*")
      .eq("id", params.id)
      .single();
    tenant = data;
  } catch {
    /* missing env */
  }

  if (!tenant) notFound();

  return (
    <div>
      <TenantNav tenant={tenant} />
      {children}
    </div>
  );
}
