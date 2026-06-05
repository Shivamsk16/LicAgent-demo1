import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function PaymentsLoading() {
  return (
    <div className="section-gap animate-fade-in">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} cols={7} />
    </div>
  );
}
