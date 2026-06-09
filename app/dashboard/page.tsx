import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { getAgentDashboardStats } from "@/lib/dashboard/queries";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";

export default async function DashboardPage() {
  const { ctx } = await getDashboardContext();
  if (!ctx) return null;

  const stats = await getAgentDashboardStats(ctx);
  const initialData = {
    ...stats,
    tenantName: ctx.tenant.name,
    role: ctx.role,
  };

  return <HomeDashboard initialData={initialData} />;
}
