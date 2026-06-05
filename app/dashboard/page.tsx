import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageHeaderSkeleton, StatGridSkeleton } from "@/components/ui/skeleton";

const HomeDashboard = dynamic(
  () =>
    import("@/components/dashboard/home-dashboard").then((m) => ({
      default: m.HomeDashboard,
    })),
  {
    loading: () => (
      <div className="section-stack">
        <PageHeaderSkeleton />
        <StatGridSkeleton count={5} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-xl bg-black/[0.04] lg:col-span-2" />
          <div className="h-72 rounded-xl bg-black/[0.04]" />
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="section-stack">
          <PageHeaderSkeleton />
          <StatGridSkeleton count={5} />
        </div>
      }
    >
      <HomeDashboard />
    </Suspense>
  );
}
