import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadKycDocument, validateKycFile } from "@/lib/storage/kyc";
import { logAction } from "@/lib/audit";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { id: customerId } = await params;
  const admin = createAdminClient();

  const { data: customer } = await admin
    .from("customers")
    .select("id, tenant_id, kyc_status")
    .eq("id", customerId)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!customer) return apiError("NOT_FOUND", "Customer not found", 404);

  const { data: docs, error: dbError } = await admin
    .from("kyc_documents")
    .select(`*, uploader:users!uploaded_by(full_name), verifier:users!verified_by(full_name)`)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (dbError) return apiError("SERVER_ERROR", dbError.message, 500);
  return apiSuccess({ documents: docs, kyc_status: customer.kyc_status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (ctx.role === "viewer") {
    return apiError("FORBIDDEN", "Cannot upload documents", 403);
  }

  const { id: customerId } = await params;
  const admin = createAdminClient();

  const { data: customer } = await admin
    .from("customers")
    .select("id, tenant_id")
    .eq("id", customerId)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!customer) return apiError("NOT_FOUND", "Customer not found", 404);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const docType = String(formData.get("doc_type") ?? "other");

  if (!file) return apiError("VALIDATION_ERROR", "File required", 400);

  const validation = validateKycFile({ type: file.type, size: file.size });
  if (validation) return apiError("VALIDATION_ERROR", validation, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadKycDocument({
    tenantId: ctx.tenantId,
    customerId,
    docType,
    fileName: file.name,
    fileBuffer: buffer,
    contentType: file.type,
  });

  if (uploaded.error) {
    return apiError("SERVER_ERROR", uploaded.error, 500);
  }

  const { data: doc, error: insertError } = await admin
    .from("kyc_documents")
    .insert({
      tenant_id: ctx.tenantId,
      customer_id: customerId,
      doc_type: docType,
      file_name: file.name,
      file_url: uploaded.path!,
      file_size_kb: Math.round(file.size / 1024),
      uploaded_by: ctx.userId,
    })
    .select()
    .single();

  if (insertError) return apiError("SERVER_ERROR", insertError.message, 500);

  await admin
    .from("customers")
    .update({ kyc_status: "uploaded", updated_at: new Date().toISOString() })
    .eq("id", customerId);

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: "kyc.uploaded",
    resourceType: "kyc_document",
    resourceId: doc!.id,
    afterState: { doc_type: docType, customer_id: customerId },
  });

  return apiSuccess(doc, 201);
}
