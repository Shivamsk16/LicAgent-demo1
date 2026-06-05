import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

const createSchema = z.object({
  policy_type: z.string().min(1),
  commission_type: z.enum(["first_year", "renewal", "bonus"]),
  rate_percentage: z.number().min(0).max(100),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effective_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return apiError(error, "Access denied", error === "UNAUTHORIZED" ? 401 : 403);

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("commission_rates")
    .select("*")
    .order("policy_type")
    .order("commission_type");

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);
  return apiSuccess(data);
}

export async function POST(request: Request) {
  const { error, user } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid input", 400);
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("commission_rates")
    .insert(parsed.data)
    .select()
    .single();

  if (dbError) return apiError("CONFLICT", dbError.message, 409);

  await logAction({
    actorId: user.id,
    action: "commission_rate.created",
    resourceType: "commission_rate",
    resourceId: data.id,
    afterState: data,
  });

  return apiSuccess(data, 201);
}
