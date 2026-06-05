import { Suspense } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { PageHeaderSkeleton, StatGridSkeleton, TableSkeleton } from "@/components/ui/skeleton";

const TeamManagement = dynamic(
  () =>
    import("@/components/team/team-management").then((m) => ({
      default: m.TeamManagement,
    })),
  {
    loading: () => (
      <div className="section-gap">
        <PageHeaderSkeleton />
        <StatGridSkeleton count={4} />
        <TableSkeleton rows={6} cols={8} />
      </div>
    ),
  }
);

export default async function TeamPage() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");
  if (ctx.role !== "branch_manager") redirect("/dashboard");

  return (
    <Suspense
      fallback={
        <div className="section-gap">
          <PageHeaderSkeleton />
          <StatGridSkeleton count={4} />
          <TableSkeleton rows={6} cols={8} />
        </div>
      }
    >
      <TeamManagement />
    </Suspense>
  );
}
