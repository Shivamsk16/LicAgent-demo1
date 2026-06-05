import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function PoliciesLoading() {
  return (
    <div className="section-gap animate-fade-in">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} cols={8} />
    </div>
  );
}
