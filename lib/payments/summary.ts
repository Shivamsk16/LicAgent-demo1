import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardContext } from "@/lib/auth/dashboard-context";

export type PaymentsSummaryParams = {
  tenantId: string;
  recordedBy: string;
  isManager: boolean;
  agentId: string | null;
  status: string | null;
  from: string | null;
  to: string | null;
  customerId: string | null;
  policyId: string | null;
  search: string | null;
};

export function buildPaymentsSummaryParams(
  ctx: DashboardContext,
  searchParams: URLSearchParams
): PaymentsSummaryParams {
  return {
    tenantId: ctx.tenantId,
    recordedBy: ctx.userId,
    isManager: ctx.isManager,
    agentId: searchParams.get("agent_id"),
    status: searchParams.get("status"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    customerId: searchParams.get("customer_id"),
    policyId: searchParams.get("policy_id"),
    search: searchParams.get("search")?.trim() ?? null,
  };
}

export async function getPaymentsCollectedSummary(
  admin: SupabaseClient,
  params: PaymentsSummaryParams
): Promise<{ totalCollected: number; error: string | null }> {
  const { data, error } = await admin.rpc("get_payments_collected_summary", {
    p_tenant_id: params.tenantId,
    p_recorded_by: params.recordedBy,
    p_is_manager: params.isManager,
    p_agent_id: params.agentId,
    p_status: params.status,
    p_from: params.from,
    p_to: params.to,
    p_customer_id: params.customerId,
    p_policy_id: params.policyId,
    p_search: params.search,
  });

  if (error) {
    return { totalCollected: 0, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const totalPaid = Number(row?.total_paid ?? 0);
  const totalLateFee = Number(row?.total_late_fee ?? 0);

  return { totalCollected: totalPaid + totalLateFee, error: null };
}
