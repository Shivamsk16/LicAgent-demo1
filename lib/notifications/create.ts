import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "premium_due"
  | "premium_overdue"
  | "payment_recorded"
  | "policy_lapsed"
  | "policy_revived"
  | "policy_in_grace"
  | "revival_pending"
  | "revival_approved"
  | "revival_rejected"
  | "kyc_verified"
  | "kyc_rejected"
  | "import_complete"
  | "team_update"
  | "commission_paid";

export async function createNotification(params: {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
  });
}
