import { PageHeaderSkeleton, StatGridSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="section-stack animate-fade-in">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={5} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 rounded-xl bg-black/[0.04] lg:col-span-2" />
        <div className="h-72 rounded-xl bg-black/[0.04]" />
      </div>
    </div>
  );
}
