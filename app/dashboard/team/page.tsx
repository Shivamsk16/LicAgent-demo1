import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { TeamManagement } from "@/components/team/team-management";

export default async function TeamPage() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");
  if (ctx.role !== "branch_manager") redirect("/dashboard");

  return <TeamManagement />;
}
