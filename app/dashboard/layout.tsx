import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (error === "NO_TENANT") redirect("/login?error=no_tenant");
  if (!ctx) redirect("/login");

  let userName: string | undefined;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("full_name")
      .eq("id", ctx.userId)
      .single();
    userName = data?.full_name;
  } catch {
    /* */
  }

  return (
    <DashboardShell
      tenantId={ctx.tenantId}
      tenantName={ctx.tenant.name}
      role={ctx.role}
      userName={userName}
    >
      {children}
    </DashboardShell>
  );
}
