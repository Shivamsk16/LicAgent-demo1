import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { generateReport, reportRowsToCSV } from "@/lib/reports/generators";
import { REPORT_IDS, type ReportId } from "@/lib/reports/types";
import { apiError } from "@/lib/api/response";

const ROW_COLUMNS: Partial<Record<ReportId, string[]>> = {
  "monthly-premium-collection": ["month", "collected", "expected", "missed"],
  "agent-performance": [
    "agent",
    "customers",
    "activePolicies",
    "premiumsCollected",
    "commissionMonth",
  ],
  "policy-status-breakdown": ["status", "count"],
  "commission-summary": ["agent", "gross", "net"],
  "policy-lapse": [
    "policyNumber",
    "customer",
    "plan",
    "lapsedOn",
    "premium",
    "agent",
  ],
  "collection-efficiency": ["month", "onTime", "late", "total"],
  "new-policies-monthly": ["created", "policyNumber", "plan", "agent"],
  "kyc-status": ["status", "count"],
  "upcoming-maturities": [
    "policyNumber",
    "customer",
    "plan",
    "maturityDate",
    "sumAssured",
    "status",
  ],
  "financial-year-summary": [
    "financialYear",
    "premiumsCollected",
    "grossCommission",
    "netCommission",
    "newPolicies",
    "activePolicies",
  ],
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  if (!ctx.isManager && ctx.role !== "senior_agent") {
    return apiError("FORBIDDEN", "Cannot export reports", 403);
  }

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

  const cols = ROW_COLUMNS[type as ReportId] ?? Object.keys(result.rows[0] ?? {});
  const csv = reportRowsToCSV(result.rows, cols);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-report.csv"`,
    },
  });
}
