import { Suspense } from "react";
import dynamic from "next/dynamic";
import { ChartSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

const CommissionDashboard = dynamic(
  () =>
    import("@/components/commission/commission-dashboard").then((m) => ({
      default: m.CommissionDashboard,
    })),
  {
    loading: () => (
      <div className="section-stack">
        <PageHeaderSkeleton />
        <ChartSkeleton />
      </div>
    ),
  }
);

export default function CommissionPage() {
  return (
    <Suspense
      fallback={
        <div className="section-stack">
          <PageHeaderSkeleton />
          <ChartSkeleton />
        </div>
      }
    >
      <CommissionDashboard />
    </Suspense>
  );
}
