import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import {
  calcLateFee,
  getFinancialYear,
  getNextDueDate,
} from "@/lib/business/payments";
import { generateReminders } from "@/lib/business/reminders";
import { createNotification } from "@/lib/notifications/create";

export async function recordPayment(params: {
  tenantId: string;
  userId: string;
  policyId: string;
  paymentDate: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  installmentNumber: number;
  paymentMode: string;
  receiptNumber?: string;
  remarks?: string;
  lateFee?: number;
}) {
  const admin = createAdminClient();

  const { data: policy } = await admin
    .from("policies")
    .select("*, customer:customers(id, full_name)")
    .eq("id", params.policyId)
    .eq("tenant_id", params.tenantId)
    .single();

  if (!policy) return { error: "Policy not found" };
  if (policy.status === "lapsed") {
    return { error: "Cannot record payment on lapsed policy" };
  }

  const { data: lastPayment } = await admin
    .from("payments")
    .select("installment_number")
    .eq("policy_id", params.policyId)
    .in("status", ["paid", "partial"])
    .order("installment_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    lastPayment &&
    params.installmentNumber < lastPayment.installment_number
  ) {
    return { error: "Installment number cannot be lower than last recorded" };
  }

  const lateFee =
    params.lateFee ??
    calcLateFee(params.amountDue, params.dueDate, params.paymentDate);

  const paymentYear = new Date(params.paymentDate).getFullYear();

  const { data: payment, error: payError } = await admin
    .from("payments")
    .insert({
      tenant_id: params.tenantId,
      policy_id: params.policyId,
      customer_id: policy.customer_id,
      recorded_by: params.userId,
      payment_date: params.paymentDate,
      due_date: params.dueDate,
      amount_due: params.amountDue,
      amount_paid: params.amountPaid,
      late_fee: lateFee,
      installment_number: params.installmentNumber,
      payment_mode: params.paymentMode,
      receipt_number: params.receiptNumber ?? null,
      financial_year: getFinancialYear(params.paymentDate),
      payment_year: paymentYear,
      status: "paid",
      remarks: params.remarks ?? null,
    })
    .select()
    .single();

  if (payError) return { error: payError.message };

  const nextDue = getNextDueDate(params.dueDate, policy.premium_frequency);
  const policyUpdates: Record<string, unknown> = {
    last_premium_date: params.paymentDate,
    next_premium_due: nextDue.toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  };

  if (policy.status === "grace_period") {
    policyUpdates.status = "in_force";
    policyUpdates.grace_period_end = null;
    await admin
      .from("policy_grace_periods")
      .update({ status: "cured", cured_on: params.paymentDate })
      .eq("policy_id", params.policyId)
      .eq("status", "active");
  }

  await admin.from("policies").update(policyUpdates).eq("id", params.policyId);

  const nextDueStr = nextDue.toISOString().slice(0, 10);
  await generateReminders({
    policyId: params.policyId,
    nextDueDate: nextDueStr,
    tenantId: params.tenantId,
    customerId: policy.customer_id,
    agentId: policy.agent_id,
  });

  await createNotification({
    tenantId: params.tenantId,
    userId: policy.agent_id,
    type: "payment_recorded",
    title: `Payment recorded — ${policy.policy_number}`,
    body: `₹${params.amountPaid} received`,
    link: `/dashboard/payments/${payment!.id}`,
  });

  await calculateCommissionForPayment(payment!, policy);

  await logAction({
    actorId: params.userId,
    tenantId: params.tenantId,
    action: "payment.recorded",
    resourceType: "payment",
    resourceId: payment!.id,
    afterState: payment as unknown as Record<string, unknown>,
  });

  return { payment };
}

async function calculateCommissionForPayment(
  payment: { id: string; amount_paid: number; payment_date: string; installment_number: number },
  policy: { id: string; tenant_id: string; agent_id: string; policy_type: string }
) {
  const admin = createAdminClient();
  const commissionType =
    payment.installment_number === 1 ? "first_year" : "renewal";

  const { data: rateRow } = await admin
    .from("commission_rates")
    .select("rate_percentage")
    .eq("policy_type", policy.policy_type)
    .eq("commission_type", commissionType)
    .lte("effective_from", payment.payment_date)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rate = rateRow?.rate_percentage ?? 0;
  const gross = Number(payment.amount_paid) * (Number(rate) / 100);
  const gst = gross * 0.18;
  const net = gross - gst;
  const fy = getFinancialYear(payment.payment_date);
  const month = payment.payment_date.slice(0, 7);

  await admin.from("commissions").insert({
    tenant_id: policy.tenant_id,
    agent_id: policy.agent_id,
    policy_id: policy.id,
    payment_id: payment.id,
    policy_type: policy.policy_type,
    commission_type: commissionType,
    premium_amount: payment.amount_paid,
    commission_rate: rate,
    commission_amount: gross,
    gst_amount: gst,
    net_commission: net,
    financial_year: fy,
    month,
    status: "pending",
  });
}
