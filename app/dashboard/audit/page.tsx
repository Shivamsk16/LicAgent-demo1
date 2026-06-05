import { Suspense } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

const BranchAuditViewer = dynamic(
  () =>
    import("@/components/audit/branch-audit-viewer").then((m) => ({
      default: m.BranchAuditViewer,
    })),
  {
    loading: () => (
      <div className="section-gap">
        <PageHeaderSkeleton />
        <TableSkeleton rows={12} cols={5} />
      </div>
    ),
  }
);

export default async function AuditPage() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");
  if (ctx.role !== "branch_manager") redirect("/dashboard");

  return (
    <Suspense
      fallback={
        <div className="section-gap">
          <PageHeaderSkeleton />
          <TableSkeleton rows={12} cols={5} />
        </div>
      }
    >
      <BranchAuditViewer />
    </Suspense>
  );
}
