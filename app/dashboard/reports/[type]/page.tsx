import { redirect, notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { REPORT_IDS, type ReportId } from "@/lib/reports/types";
import { ReportViewer } from "@/components/reports/report-viewer";

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

  return <ReportViewer reportId={type as ReportId} />;
}
