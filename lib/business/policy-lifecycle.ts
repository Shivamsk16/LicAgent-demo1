import { addDays, format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications/create";
import { sendPolicyLapsedEmail, sendGracePeriodEmail } from "@/lib/integrations/resend";
import { sendSMS } from "@/lib/integrations/msg91";

const today = () => format(new Date(), "yyyy-MM-dd");

function getNestedName(
  val: { full_name?: string } | { full_name?: string }[] | null | undefined
) {
  if (!val) return "";
  if (Array.isArray(val)) return val[0]?.full_name ?? "";
  return val.full_name ?? "";
}

export async function runGracePeriodCheck() {
  const admin = createAdminClient();
  const t = today();

  const { data: overdue } = await admin
    .from("policies")
    .select(
      `*, customer:customers(full_name), agent:users!agent_id(id, full_name, email, phone)`
    )
    .eq("status", "in_force")
    .lt("next_premium_due", t)
    .is("grace_period_end", null);

  let count = 0;
  for (const policy of overdue ?? []) {
    const graceEnd = format(addDays(new Date(), 30), "yyyy-MM-dd");
    await admin
      .from("policies")
      .update({
        status: "grace_period",
        grace_period_end: graceEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", policy.id);

    const { data: existing } = await admin
      .from("policy_grace_periods")
      .select("id")
      .eq("policy_id", policy.id)
      .eq("status", "active")
      .maybeSingle();

    if (!existing) {
      await admin.from("policy_grace_periods").insert({
        tenant_id: policy.tenant_id,
        policy_id: policy.id,
        missed_due_date: policy.next_premium_due,
        grace_start: t,
        grace_end: graceEnd,
        status: "active",
      });
    }

    const agent = policy.agent as {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
    };
    const customer = policy.customer as { full_name: string };

    await createNotification({
      tenantId: policy.tenant_id,
      userId: agent.id,
      type: "policy_in_grace",
      title: `Policy ${policy.policy_number} in grace period`,
      body: `${customer?.full_name} — premium overdue. Grace ends ${graceEnd}.`,
      link: `/dashboard/policies/${policy.id}`,
    });

    if (agent.email) {
      await sendGracePeriodEmail({
        to: agent.email,
        agentName: agent.full_name,
        customerName: customer?.full_name ?? "",
        policyNumber: policy.policy_number,
        amount: String(policy.premium_amount),
        graceEnd,
      });
    }

    if (agent.phone) {
      await sendSMS(agent.phone, "premium_due_7", {
        agent_name: agent.full_name,
        customer_name: customer?.full_name ?? "",
        policy_no: policy.policy_number,
        amount: String(policy.premium_amount),
        due_date: policy.next_premium_due ?? t,
      }).catch(() => {});
    }

    count++;
  }

  return { processed: count };
}

export async function runLapseCheck() {
  const admin = createAdminClient();
  const t = today();

  await admin
    .from("policy_grace_periods")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("grace_end", t);

  const { data: toLapse } = await admin
    .from("policies")
    .select(
      `*, customer:customers(full_name), agent:users!agent_id(id, full_name, email, phone)`
    )
    .eq("status", "grace_period")
    .lt("grace_period_end", t);

  let count = 0;
  for (const policy of toLapse ?? []) {
    const revivalDeadline = format(addDays(new Date(), 730), "yyyy-MM-dd");

    await admin
      .from("policies")
      .update({
        status: "lapsed",
        lapsed_on: t,
        revival_deadline: revivalDeadline,
        grace_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", policy.id);

    const agent = policy.agent as {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
    };
    const customer = policy.customer as { full_name: string };

    await createNotification({
      tenantId: policy.tenant_id,
      userId: agent.id,
      type: "policy_lapsed",
      title: `Policy ${policy.policy_number} lapsed`,
      body: `${customer?.full_name} — contact customer for revival.`,
      link: `/dashboard/policies/${policy.id}`,
    });

    if (agent.email) {
      await sendPolicyLapsedEmail({
        to: agent.email,
        agentName: agent.full_name,
        customerName: customer?.full_name ?? "",
        policyNumber: policy.policy_number,
      });
    }

    if (agent.phone) {
      await sendSMS(agent.phone, "policy_lapsed", {
        agent_name: agent.full_name,
        customer_name: customer?.full_name ?? "",
        policy_no: policy.policy_number,
        amount: String(policy.premium_amount),
        due_date: t,
      }).catch(() => {});
    }

    await logAction({
      actorId: agent.id,
      tenantId: policy.tenant_id,
      action: "policy.lapsed",
      resourceType: "policy",
      resourceId: policy.id,
      beforeState: { status: "grace_period" },
      afterState: { status: "lapsed", lapsed_on: t },
    });

    count++;
  }

  return { processed: count };
}

export async function runMaturityCheck() {
  const admin = createAdminClient();
  const t = today();

  const { data } = await admin
    .from("policies")
    .select("id, tenant_id, agent_id, policy_number")
    .eq("status", "in_force")
    .lte("maturity_date", t)
    .not("maturity_date", "is", null);

  for (const p of data ?? []) {
    await admin
      .from("policies")
      .update({ status: "matured", updated_at: new Date().toISOString() })
      .eq("id", p.id);

    await createNotification({
      tenantId: p.tenant_id,
      userId: p.agent_id,
      type: "premium_due",
      title: `Policy ${p.policy_number} matured`,
      link: `/dashboard/policies/${p.id}`,
    });
  }

  return { processed: data?.length ?? 0 };
}

export async function runOverdueEscalation() {
  const admin = createAdminClient();
  const t = today();

  const { data: overdue } = await admin
    .from("policies")
    .select("id, tenant_id, agent_id, policy_number, next_premium_due, premium_amount, customer:customers(full_name)")
    .eq("status", "in_force")
    .lt("next_premium_due", t);

  let count = 0;
  for (const p of overdue ?? []) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(p.next_premium_due!).getTime()) / 86400000
    );
    if (daysOverdue === 1 || daysOverdue === 7 || daysOverdue === 15) {
      await createNotification({
        tenantId: p.tenant_id,
        userId: p.agent_id,
        type: "premium_overdue",
        title: `Premium overdue — ${p.policy_number}`,
        body: `${getNestedName(p.customer)} · ${daysOverdue} days overdue`,
        link: `/dashboard/payments/record?policy=${p.id}`,
      });
      count++;
    }
    if (daysOverdue === 15) {
      const { data: managers } = await admin
        .from("tenant_members")
        .select("user_id, roles(name)")
        .eq("tenant_id", p.tenant_id)
        .eq("status", "active");

      for (const m of managers ?? []) {
        const role = (m.roles as { name: string } | { name: string }[] | null);
        const roleName = Array.isArray(role) ? role[0]?.name : role?.name;
        if (roleName === "branch_manager") {
          await createNotification({
            tenantId: p.tenant_id,
            userId: m.user_id,
            type: "premium_overdue",
            title: `Branch alert: ${p.policy_number} overdue 15+ days`,
            link: `/dashboard/policies/${p.id}`,
          });
        }
      }
    }
  }

  return { processed: count };
}

export async function runRevivalDeadlineWarnings() {
  const admin = createAdminClient();
  const warnDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const { data } = await admin
    .from("policies")
    .select("id, tenant_id, agent_id, policy_number, revival_deadline")
    .eq("status", "lapsed")
    .lte("revival_deadline", warnDate)
    .gte("revival_deadline", today());

  for (const p of data ?? []) {
    await createNotification({
      tenantId: p.tenant_id,
      userId: p.agent_id,
      type: "policy_lapsed",
      title: `Revival deadline approaching — ${p.policy_number}`,
      body: `Revive before ${p.revival_deadline}`,
      link: `/dashboard/policies/${p.id}/revival`,
    });
  }

  return { processed: data?.length ?? 0 };
}
