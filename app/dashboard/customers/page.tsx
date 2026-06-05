import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

const CustomersList = dynamic(
  () =>
    import("@/components/customers/customers-list").then((m) => ({
      default: m.CustomersList,
    })),
  {
    loading: () => (
      <div className="section-gap">
        <PageHeaderSkeleton />
        <TableSkeleton rows={10} cols={8} />
      </div>
    ),
  }
);

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="section-gap">
          <PageHeaderSkeleton />
          <TableSkeleton rows={10} cols={8} />
        </div>
      }
    >
      <CustomersList />
    </Suspense>
  );
}
