import { getDashboardContext } from "@/lib/auth/dashboard-context";
import {
  listCommissions,
  getCommissionSummary,
  getCommissionChartData,
  commissionsToCSV,
} from "@/lib/commission/queries";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { searchParams } = new URL(request.url);
  const formatOut = searchParams.get("format");

  const filters = {
    month: searchParams.get("month") ?? undefined,
    fy: searchParams.get("fy") ?? undefined,
    commissionType: searchParams.get("commission_type") ?? undefined,
    policyType: searchParams.get("policy_type") ?? undefined,
    agentId: searchParams.get("agent_id") ?? undefined,
  };

  if (formatOut === "csv") {
    const rows = await listCommissions(ctx, { ...filters, limit: 5000 });
    const csv = commissionsToCSV(rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="commissions-${filters.month ?? "all"}.csv"`,
      },
    });
  }

  const [summary, commissions, charts] = await Promise.all([
    getCommissionSummary(ctx, filters),
    listCommissions(ctx, { ...filters, limit: 500 }),
    getCommissionChartData(ctx),
  ]);

  return apiSuccess({ summary, commissions, charts });
}
