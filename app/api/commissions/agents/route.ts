import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { listTenantAgents } from "@/lib/commission/queries";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (!ctx.isManager) return apiError("FORBIDDEN", "Managers only", 403);

  const agents = await listTenantAgents(ctx.tenantId);
  return apiSuccess({ agents });
}
