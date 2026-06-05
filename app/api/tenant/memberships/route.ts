import { getSessionUser } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_members")
    .select("tenant_id, tenants(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const tenants = (data ?? []).map((m) => {
    const t = m.tenants as { id: string; name: string } | { id: string; name: string }[] | null;
    const row = Array.isArray(t) ? t[0] : t;
    return { id: row?.id ?? m.tenant_id, name: row?.name ?? "Branch" };
  });

  return apiSuccess(tenants);
}
