import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { ReportsHub } from "@/components/reports/reports-hub";

export default async function ReportsPage() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");

  if (!ctx.isManager && ctx.role !== "senior_agent") redirect("/dashboard");

  return <ReportsHub />;
}
