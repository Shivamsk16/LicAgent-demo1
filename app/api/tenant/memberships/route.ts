import { getSessionUser, getActiveMemberships } from "@/lib/auth/cached-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const memberships = await getActiveMemberships(user.id);
  if (!memberships.length) return apiSuccess([]);

  const admin = createAdminClient();
  const tenantIds = memberships.map((m) => m.tenant_id);
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, name")
    .in("id", tenantIds);

  const nameById = new Map(
    (tenants ?? []).map((t) => [t.id, t.name as string])
  );

  const result = memberships.map((m) => ({
    id: m.tenant_id,
    name: nameById.get(m.tenant_id) ?? "Branch",
  }));

  return apiSuccess(result);
}
