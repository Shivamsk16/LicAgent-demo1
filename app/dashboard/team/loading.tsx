import { PageHeaderSkeleton, StatGridSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="section-gap animate-fade-in">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <TableSkeleton rows={6} cols={8} />
    </div>
  );
}
