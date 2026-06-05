import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  paginated,
  parseListParams,
  type FilterableQuery,
} from "@/lib/api/list-params";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role !== "branch_manager") {
    return apiError("FORBIDDEN", "Branch manager only", 403);
  }

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams, { defaultSort: "created_at", defaultOrder: "desc" });
  const action = searchParams.get("action");
  const actorId = searchParams.get("actor_id");
  const resourceType = searchParams.get("resource_type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const formatOut = searchParams.get("format");

  const admin = createAdminClient();

  function applyFilters(query: FilterableQuery): FilterableQuery {
    if (action) query = query.ilike("action", `%${action}%`);
    if (actorId) query = query.eq("actor_id", actorId);
    if (resourceType) query = query.eq("resource_type", resourceType);
    if (from) query = query.gte("created_at", `${from}T00:00:00`);
    if (to) query = query.lte("created_at", `${to}T23:59:59`);
    return query;
  }

  if (formatOut === "csv") {
    let query = admin
      .from("audit_logs")
      .select(`*, actor:users(id, full_name, email)`)
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false })
      .limit(5000);
    query = applyFilters(query);
    const { data } = await query;
    const header = "Time,Actor,Action,Resource,Resource ID,IP";
    const lines = (data ?? []).map((log) => {
      const actor = log.actor as { full_name: string } | { full_name: string }[] | null;
      const name = Array.isArray(actor) ? actor[0]?.full_name : actor?.full_name;
      return [
        log.created_at,
        name ?? "",
        log.action,
        log.resource_type ?? "",
        log.resource_id ?? "",
        log.ip_address ?? "",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    return new Response([header, ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=branch-audit.csv",
      },
    });
  }

  let query = admin
    .from("audit_logs")
    .select(`*, actor:users(id, full_name, email)`, { count: "exact" })
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: list.order === "asc" });
  query = applyFilters(query);
  query = query.range(list.offset, list.offset + list.pageSize - 1);

  const { data, error: dbError, count } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  return apiSuccess(paginated(data ?? [], count ?? 0, list.page, list.pageSize));
}
