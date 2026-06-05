import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { BranchSettings } from "@/components/settings/branch-settings";

export default async function SettingsPage() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");

  return <BranchSettings tenant={ctx.tenant} role={ctx.role} isManager={ctx.isManager} />;
}
