import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { provisionBranch } from "@/lib/business/provision-tenant";
import { attachTenantStats } from "@/lib/superadmin/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
const provisionSchema = z.object({
  name: z.string().min(2),
  branch_code: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  plan: z.enum(["trial", "starter", "pro", "enterprise"]),
  max_agents: z.number().int().min(1).max(500).default(50),
  billing_cycle: z.enum(["monthly", "yearly"]).default("monthly"),
  manager_name: z.string().min(2),
  manager_email: z.string().email(),
  manager_phone: z.string().regex(/^[6-9]\d{9}$/),
  manager_employee_id: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const state = searchParams.get("state");

  const admin = createAdminClient();
  let query = admin.from("tenants").select("*").order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,branch_code.ilike.%${search}%,city.ilike.%${search}%`
    );
  }
  if (status && status !== "all") query = query.eq("status", status);
  if (plan && plan !== "all") query = query.eq("plan", plan);
  if (state && state !== "all") query = query.eq("state", state);

  const { data, error: dbError } = await query;
  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  const tenants = await attachTenantStats(data ?? []);
  return apiSuccess(tenants);
}

export async function POST(request: Request) {
  const { error, user } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const body = await request.json();
  const parsed = provisionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const result = await provisionBranch(
    {
      ...parsed.data,
      email: parsed.data.email || undefined,
    },
    user.id
  );

  if ("error" in result && result.error) {
    return apiError("CONFLICT", result.error, 409);
  }

  return apiSuccess(result, 201);
}
