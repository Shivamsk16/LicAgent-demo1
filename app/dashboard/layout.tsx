import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { isSuperAdmin, getSessionUser } from "@/lib/auth/cached-auth";
import { QueryProviders } from "@/app/query-providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (error === "NO_TENANT") {
    const user = await getSessionUser();
    if (user && (await isSuperAdmin(user.id))) redirect("/superadmin");
    redirect("/login?error=no_tenant");
  }
  if (error === "TRIAL_EXPIRED") redirect("/trial-expired");
  if (error === "ACCOUNT_SUSPENDED") redirect("/account-suspended");
  if (error === "FORBIDDEN" || !ctx) redirect("/account-suspended");

  return (
    <QueryProviders>
      <DashboardShell
        tenantId={ctx.tenantId}
        tenantName={ctx.tenant.name}
        role={ctx.role}
        userName={ctx.userName}
        membershipCount={ctx.membershipCount}
      >
        {children}
      </DashboardShell>
    </QueryProviders>
  );
}
