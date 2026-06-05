import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications/create";
import { getKycSignedUrl } from "@/lib/storage/kyc";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { id: customerId, docId } = await params;
  const admin = createAdminClient();

  const { data: doc } = await admin
    .from("kyc_documents")
    .select("file_url, file_name")
    .eq("id", docId)
    .eq("customer_id", customerId)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!doc) return apiError("NOT_FOUND", "Document not found", 404);

  const signed = await getKycSignedUrl(doc.file_url);
  if (signed.error) return apiError("SERVER_ERROR", signed.error, 500);

  return apiSuccess({ url: signed.url, fileName: doc.file_name });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);
  if (!ctx.isManager) {
    return apiError("FORBIDDEN", "Manager or senior agent required to verify KYC", 403);
  }

  const { id: customerId, docId } = await params;
  const body = await request.json();
  const verified = body.verified === true;
  const rejectionReason = body.rejection_reason as string | undefined;

  const admin = createAdminClient();

  const { data: doc } = await admin
    .from("kyc_documents")
    .select("*, customer:customers(assigned_agent_id, full_name)")
    .eq("id", docId)
    .eq("customer_id", customerId)
    .eq("tenant_id", ctx.tenantId)
    .single();

  if (!doc) return apiError("NOT_FOUND", "Document not found", 404);

  const { data: updated, error: upError } = await admin
    .from("kyc_documents")
    .update({
      verified,
      verified_by: ctx.userId,
      verified_at: new Date().toISOString(),
      rejection_reason: verified ? null : rejectionReason ?? "Rejected",
    })
    .eq("id", docId)
    .select()
    .single();

  if (upError) return apiError("SERVER_ERROR", upError.message, 500);

  const kycStatus = verified ? "verified" : "rejected";
  await admin
    .from("customers")
    .update({ kyc_status: kycStatus, updated_at: new Date().toISOString() })
    .eq("id", customerId);

  const custRaw = doc.customer as {
    assigned_agent_id: string;
    full_name: string;
  } | { assigned_agent_id: string; full_name: string }[] | null;
  const cust = Array.isArray(custRaw) ? custRaw[0] : custRaw;

  if (cust?.assigned_agent_id) {
    await createNotification({
      tenantId: ctx.tenantId,
      userId: cust.assigned_agent_id,
      type: verified ? "kyc_verified" : "kyc_rejected",
      title: verified ? "KYC verified" : "KYC rejected",
      body: `${cust.full_name} — document ${verified ? "approved" : "rejected"}`,
      link: `/dashboard/customers/${customerId}`,
    });
  }

  await logAction({
    actorId: ctx.userId,
    tenantId: ctx.tenantId,
    action: verified ? "kyc.verified" : "kyc.rejected",
    resourceType: "kyc_document",
    resourceId: docId,
    afterState: { verified, customer_id: customerId },
  });

  return apiSuccess(updated);
}
