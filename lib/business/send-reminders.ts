import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create";
import { sendPremiumReminderEmail } from "@/lib/integrations/resend";
import { sendSMS } from "@/lib/integrations/msg91";

export async function runSendReminders() {
  const admin = createAdminClient();
  const t = format(new Date(), "yyyy-MM-dd");

  const { data: dueToday } = await admin
    .from("premium_reminders")
    .select(
      `*,
       policy:policies(policy_number, premium_amount),
       customer:customers(full_name),
       agent:users!agent_id(id, full_name, email, phone)`
    )
    .eq("reminder_date", t)
    .eq("status", "pending");

  let sent = 0;
  let failed = 0;

  for (const reminder of dueToday ?? []) {
    const channels = (reminder.channel as string[]) ?? [];
    const policy = reminder.policy as { policy_number: string; premium_amount: number };
    const customer = reminder.customer as { full_name: string };
    const agent = reminder.agent as {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
    };

    try {
      for (const ch of channels) {
        if (ch === "in_app") {
          await createNotification({
            tenantId: reminder.tenant_id,
            userId: agent.id,
            type: "premium_due",
            title: `Premium due ${reminder.days_before_due === 1 ? "tomorrow" : `in ${reminder.days_before_due} days`}`,
            body: `${customer?.full_name} · ${policy?.policy_number} · ₹${policy?.premium_amount}`,
            link: `/dashboard/payments/record?policy=${reminder.policy_id}`,
          });
        }
        if (ch === "email" && agent.email) {
          await sendPremiumReminderEmail({
            to: agent.email,
            agentName: agent.full_name,
            customerName: customer?.full_name ?? "",
            policyNumber: policy?.policy_number ?? "",
            amount: String(policy?.premium_amount ?? 0),
            dueDate: reminder.due_date,
            daysBefore: reminder.days_before_due,
          });
        }
        if (ch === "sms" && agent.phone) {
          const templateKey =
            reminder.days_before_due <= 1
              ? "premium_due_today"
              : reminder.days_before_due <= 7
                ? "premium_due_7"
                : "premium_due_30";
          const result = await sendSMS(agent.phone, templateKey, {
            agent_name: agent.full_name,
            customer_name: customer?.full_name ?? "",
            policy_no: policy?.policy_number ?? "",
            amount: String(policy?.premium_amount ?? 0),
            due_date: reminder.due_date,
          });
          if (result.messageId) {
            await admin
              .from("premium_reminders")
              .update({ sms_message_id: result.messageId })
              .eq("id", reminder.id);
          }
        }
      }

      await admin
        .from("premium_reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", reminder.id);
      sent++;
    } catch (e) {
      failed++;
      await admin
        .from("premium_reminders")
        .update({
          status: "failed",
          error_message: e instanceof Error ? e.message : "Send failed",
        })
        .eq("id", reminder.id);
    }
  }

  return { sent, failed, total: dueToday?.length ?? 0 };
}
