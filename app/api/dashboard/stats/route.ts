import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { getAgentDashboardStats } from "@/lib/dashboard/queries";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "NO_TENANT") return apiError("FORBIDDEN", "No active branch", 403);
  if (error === "FORBIDDEN" || !ctx) return apiError("FORBIDDEN", "Access denied", 403);

  try {
    const stats = await getAgentDashboardStats(ctx);
    return apiSuccess({ ...stats, tenantName: ctx.tenant.name, role: ctx.role });
  } catch (e) {
    return apiError(
      "SERVER_ERROR",
      e instanceof Error ? e.message : "Failed",
      500
    );
  }
}
