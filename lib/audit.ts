import { createAdminClient } from "@/lib/supabase/admin";

export async function logAction(params: {
  actorId: string;
  tenantId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}) {
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    actor_id: params.actorId,
    tenant_id: params.tenantId ?? null,
    action: params.action,
    resource_type: params.resourceType ?? null,
    resource_id: params.resourceId ?? null,
    before_state: params.beforeState ?? null,
    after_state: params.afterState ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  });
}
