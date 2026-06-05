import { differenceInMonths, format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications/create";
import { sendRevivalPendingEmail } from "@/lib/integrations/resend";
import { getNextDueDate } from "@/lib/business/payments";
import { generateReminders } from "@/lib/business/reminders";

export function calculateRevivalCosts(params: {
  premiumAmount: number;
  lapsedOn: string;
  premiumFrequency: string;
  penalty?: number;
}) {
  const lapsed = new Date(params.lapsedOn);
  const monthsLapsed = Math.max(1, differenceInMonths(new Date(), lapsed));
  const installmentsPerYear =
    params.premiumFrequency === "monthly"
      ? 12
      : params.premiumFrequency === "quarterly"
        ? 4
        : params.premiumFrequency === "half_yearly"
          ? 2
          : 1;
  const missedInstallments = Math.ceil(
    (monthsLapsed / 12) * installmentsPerYear
  );
  const arrears = missedInstallments * params.premiumAmount;
  const interest = arrears * 0.08 * (monthsLapsed / 12);
  const penalty = params.penalty ?? 0;
  const total = arrears + interest + penalty;
  const medicalRequired = monthsLapsed > 6;

  return {
    arrears_amount: Math.round(arrears * 100) / 100,
    interest_amount: Math.round(interest * 100) / 100,
    penalty_amount: penalty,
    total_revival_cost: Math.round(total * 100) / 100,
    missed_installments: missedInstallments,
    medical_required: medicalRequired,
  };
}

export async function initiateRevival(params: {
  tenantId: string;
  policyId: string;
  userId: string;
  paymentMode?: string;
  receiptNumber?: string;
  penaltyAmount?: number;
  notes?: string;
  medicalRequired?: boolean;
}) {
  const admin = createAdminClient();
  const { data: policy } = await admin
    .from("policies")
    .select("*, customer:customers(id, full_name)")
    .eq("id", params.policyId)
    .eq("tenant_id", params.tenantId)
    .single();

  if (!policy || policy.status !== "lapsed") {
    return { error: "Policy must be lapsed to initiate revival" };
  }
  if (policy.revival_deadline && new Date(policy.revival_deadline) < new Date()) {
    return { error: "Revival deadline has passed" };
  }

  const costs = calculateRevivalCosts({
    premiumAmount: Number(policy.premium_amount),
    lapsedOn: policy.lapsed_on ?? format(new Date(), "yyyy-MM-dd"),
    premiumFrequency: policy.premium_frequency,
    penalty: params.penaltyAmount,
  });

  const { data: revival, error } = await admin
    .from("policy_revivals")
    .insert({
      tenant_id: params.tenantId,
      policy_id: params.policyId,
      requested_by: params.userId,
      revival_date: format(new Date(), "yyyy-MM-dd"),
      arrears_amount: costs.arrears_amount,
      interest_amount: costs.interest_amount,
      penalty_amount: costs.penalty_amount,
      total_revival_cost: costs.total_revival_cost,
      payment_mode: params.paymentMode ?? null,
      receipt_number: params.receiptNumber ?? null,
      medical_required: params.medicalRequired ?? costs.medical_required,
      notes: params.notes ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const { data: requester } = await admin
    .from("users")
    .select("full_name")
    .eq("id", params.userId)
    .single();

  const { data: managers } = await admin
    .from("tenant_members")
    .select("user_id, users(email, full_name), roles(name)")
    .eq("tenant_id", params.tenantId)
    .eq("status", "active");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const m of managers ?? []) {
    const role = m.roles as { name: string } | { name: string }[] | null;
    const roleName = Array.isArray(role) ? role[0]?.name : role?.name;
    if (roleName !== "branch_manager") continue;

    await createNotification({
      tenantId: params.tenantId,
      userId: m.user_id,
      type: "revival_pending",
      title: `Revival pending approval — ${policy.policy_number}`,
      link: `/dashboard/policies/${params.policyId}/revival`,
    });

    const usersRaw = m.users as { email: string; full_name: string } | { email: string; full_name: string }[] | null;
    const user = Array.isArray(usersRaw) ? usersRaw[0] : usersRaw;
    if (user?.email) {
      await sendRevivalPendingEmail({
        to: user.email,
        managerName: user.full_name,
        policyNumber: policy.policy_number,
        agentName: requester?.full_name ?? "Agent",
        totalCost: String(costs.total_revival_cost),
        approvalUrl: `${appUrl}/dashboard/policies/${params.policyId}/revival`,
      });
    }
  }

  await logAction({
    actorId: params.userId,
    tenantId: params.tenantId,
    action: "revival.initiated",
    resourceType: "policy_revival",
    resourceId: revival!.id,
    afterState: revival as unknown as Record<string, unknown>,
  });

  return { revival, costs };
}

export async function approveRevival(params: {
  revivalId: string;
  tenantId: string;
  approverId: string;
  approve: boolean;
  rejectionReason?: string;
}) {
  const admin = createAdminClient();

  const { data: revival } = await admin
    .from("policy_revivals")
    .select("*, policy:policies(*)")
    .eq("id", params.revivalId)
    .eq("tenant_id", params.tenantId)
    .single();

  if (!revival || revival.status !== "pending") {
    return { error: "Revival not found or already processed" };
  }

  const policy = revival.policy as {
    id: string;
    tenant_id: string;
    customer_id: string;
    agent_id: string;
    premium_amount: number;
    premium_frequency: string;
    policy_number: string;
  };

  if (!params.approve) {
    await admin
      .from("policy_revivals")
      .update({
        status: "rejected",
        approved_by: params.approverId,
        approved_at: new Date().toISOString(),
        rejection_reason: params.rejectionReason ?? null,
      })
      .eq("id", params.revivalId);

    await createNotification({
      tenantId: params.tenantId,
      userId: revival.requested_by,
      type: "revival_rejected",
      title: `Revival rejected — ${policy.policy_number}`,
      body: params.rejectionReason,
    });

    await logAction({
      actorId: params.approverId,
      tenantId: params.tenantId,
      action: "revival.rejected",
      resourceId: params.revivalId,
    });

    return { revival: { status: "rejected" } };
  }

  const revivalDate = revival.revival_date;
  const nextDue = getNextDueDate(revivalDate, policy.premium_frequency);

  await admin
    .from("policies")
    .update({
      status: "revived",
      lapsed_on: null,
      revival_deadline: null,
      grace_period_end: null,
      next_premium_due: format(nextDue, "yyyy-MM-dd"),
      last_premium_date: revivalDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", policy.id);

  await admin.from("payments").insert({
    tenant_id: params.tenantId,
    policy_id: policy.id,
    customer_id: policy.customer_id,
    recorded_by: params.approverId,
    payment_date: revivalDate,
    due_date: revivalDate,
    amount_due: revival.total_revival_cost,
    amount_paid: revival.total_revival_cost,
    installment_number: 999,
    payment_mode: revival.payment_mode ?? "cash",
    receipt_number: revival.receipt_number,
    status: "paid",
    is_revival_payment: true,
    revival_id: params.revivalId,
    remarks: "Policy revival payment",
  });

  await admin
    .from("policy_revivals")
    .update({
      status: "completed",
      approved_by: params.approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", params.revivalId);

  await generateReminders({
    policyId: policy.id,
    nextDueDate: format(nextDue, "yyyy-MM-dd"),
    tenantId: params.tenantId,
    customerId: policy.customer_id,
    agentId: policy.agent_id,
  });

  await createNotification({
    tenantId: params.tenantId,
    userId: revival.requested_by,
    type: "policy_revived",
    title: `Revival approved — ${policy.policy_number}`,
    link: `/dashboard/policies/${policy.id}`,
  });

  await logAction({
    actorId: params.approverId,
    tenantId: params.tenantId,
    action: "revival.approved",
    resourceId: params.revivalId,
    afterState: { status: "completed" },
  });

  return { success: true };
}
