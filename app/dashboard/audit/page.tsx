import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { BranchAuditViewer } from "@/components/audit/branch-audit-viewer";

export default async function AuditPage() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");
  if (ctx.role !== "branch_manager") redirect("/dashboard");

  return <BranchAuditViewer />;
}
