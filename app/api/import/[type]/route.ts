import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { processImportJob } from "@/lib/import/process-import";
import type { ImportType } from "@/lib/import/templates";
import { parseCSV, rowsToObjects } from "@/lib/import/parse-csv";
import { apiError, apiSuccess } from "@/lib/api/response";

const TYPES: ImportType[] = ["customers", "policies", "payments"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (!ctx.isManager) {
    return apiError("FORBIDDEN", "Manager or senior agent required", 403);
  }

  const { type } = await params;
  if (!TYPES.includes(type as ImportType)) {
    return apiError("NOT_FOUND", "Unknown import type", 404);
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const skipErrors = formData.get("skip_errors") === "true";
  const previewOnly = formData.get("preview") === "true";

  if (!file) return apiError("VALIDATION_ERROR", "File required", 400);
  if (file.size > 10 * 1024 * 1024) {
    return apiError("VALIDATION_ERROR", "File must be under 10MB", 400);
  }

  const text = await file.text();
  const rows = parseCSV(text);
  const { headers, records } = rowsToObjects(rows);

  if (previewOnly) {
    return apiSuccess({
      headers,
      preview: records.slice(0, 5),
      totalRows: records.length,
    });
  }

  const admin = createAdminClient();
  const { data: job, error: jobError } = await admin
    .from("import_jobs")
    .insert({
      tenant_id: ctx.tenantId,
      uploaded_by: ctx.userId,
      file_name: file.name,
      import_type: type,
      status: "pending",
      total_rows: records.length,
    })
    .select()
    .single();

  if (jobError || !job) {
    return apiError("SERVER_ERROR", jobError?.message ?? "Failed to create job", 500);
  }

  const result = await processImportJob({
    jobId: job.id,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    importType: type as ImportType,
    csvText: text,
    skipErrors,
  });

  return apiSuccess({ jobId: job.id, ...result });
}
