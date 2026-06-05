import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return apiError(error, "Access denied", error === "UNAUTHORIZED" ? 401 : 403);

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const action = searchParams.get("action");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const admin = createAdminClient();
  let query = admin
    .from("audit_logs")
    .select(`*, actor:users(id, full_name, email)`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (action) query = query.ilike("action", `%${action}%`);

  const { data, error: dbError } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);
  return apiSuccess(data);
}
