import { redirect, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { REPORT_IDS, type ReportId } from "@/lib/reports/types";
import { ChartSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

const ReportViewer = dynamic(
  () =>
    import("@/components/reports/report-viewer").then((m) => ({
      default: m.ReportViewer,
    })),
  {
    loading: () => (
      <div className="section-gap">
        <PageHeaderSkeleton />
        <ChartSkeleton />
      </div>
    ),
  }
);

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!REPORT_IDS.includes(type as ReportId)) notFound();

  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");

  return (
    <Suspense
      fallback={
        <div className="section-gap">
          <PageHeaderSkeleton />
          <ChartSkeleton />
        </div>
      }
    >
      <ReportViewer reportId={type as ReportId} />
    </Suspense>
  );
}
