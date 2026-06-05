import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { TeamInvites } from "@/components/team/team-invites";

export default async function TeamInvitesPage() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");
  if (ctx.role !== "branch_manager") redirect("/dashboard");

  return <TeamInvites />;
}
