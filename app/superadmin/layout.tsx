import { SuperAdminShell } from "@/components/layout/superadmin-shell";
import { getSessionUser } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { QueryProviders } from "@/app/query-providers";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userName: string | undefined;
  try {
    const user = await getSessionUser();
    if (user) {
      const admin = createAdminClient();
      const { data } = await admin
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();
      userName = data?.full_name;
    }
  } catch {
    /* env not configured */
  }

  return (
    <QueryProviders>
      <SuperAdminShell userName={userName}>{children}</SuperAdminShell>
    </QueryProviders>
  );
}
