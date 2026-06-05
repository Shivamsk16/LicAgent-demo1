import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

const PoliciesList = dynamic(
  () =>
    import("@/components/policies/policies-list").then((m) => ({
      default: m.PoliciesList,
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

export default function PoliciesPage() {
  return (
    <Suspense
      fallback={
        <div className="section-gap">
          <PageHeaderSkeleton />
          <TableSkeleton rows={10} cols={8} />
        </div>
      }
    >
      <PoliciesList />
    </Suspense>
  );
}
