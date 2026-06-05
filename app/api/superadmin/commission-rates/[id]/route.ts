import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

const updateSchema = z.object({
  rate_percentage: z.number().min(0).max(100).optional(),
  effective_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireSuperAdmin();
  if (error === "UNAUTHORIZED") return apiError("UNAUTHORIZED", "Not signed in", 401);
  if (error === "FORBIDDEN") return apiError("FORBIDDEN", "SuperAdmin only", 403);
  if (!user) return apiError("UNAUTHORIZED", "Not signed in", 401);

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid input", 400);

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("commission_rates")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data, error: dbError } = await admin
    .from("commission_rates")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);

  await logAction({
    actorId: user.id,
    action: "commission_rate.updated",
    resourceType: "commission_rate",
    resourceId: params.id,
    beforeState: before ?? undefined,
    afterState: data,
  });

  return apiSuccess(data);
}
