import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (!ctx.isManager) {
    return apiError("FORBIDDEN", "Manager or senior agent required", 403);
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("import_jobs")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (dbError) return apiError("NOT_FOUND", "Job not found", 404);
  return apiSuccess(data);
}
