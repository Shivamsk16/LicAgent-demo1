import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { generateReport } from "@/lib/reports/generators";
import { REPORT_IDS, type ReportId } from "@/lib/reports/types";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { type } = await params;
  if (!REPORT_IDS.includes(type as ReportId)) {
    return apiError("NOT_FOUND", "Unknown report type", 404);
  }

  const { searchParams } = new URL(request.url);
  const result = await generateReport(type as ReportId, ctx, {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    fy: searchParams.get("fy") ?? undefined,
  });

  if ("error" in result) {
    return apiError("FORBIDDEN", result.error, 403);
  }

  return apiSuccess(result);
}
