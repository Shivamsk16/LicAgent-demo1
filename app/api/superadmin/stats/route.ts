import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { getPlatformStats } from "@/lib/superadmin/queries";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const { error, user } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  try {
    const stats = await getPlatformStats();
    return apiSuccess(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return apiError("SERVER_ERROR", message, 500);
  }
}
