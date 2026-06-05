import { subDays, format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

const REMINDER_SCHEDULE = [
  { daysBeforeDue: 30, channels: ["in_app"] },
  { daysBeforeDue: 7, channels: ["in_app", "email"] },
  { daysBeforeDue: 1, channels: ["in_app", "sms"] },
] as const;

export async function generateReminders(params: {
  policyId: string;
  nextDueDate: string | Date;
  tenantId: string;
  customerId: string;
  agentId: string;
}) {
  const admin = createAdminClient();
  const dueStr =
    typeof params.nextDueDate === "string"
      ? params.nextDueDate.slice(0, 10)
      : format(params.nextDueDate, "yyyy-MM-dd");

  await admin
    .from("premium_reminders")
    .delete()
    .eq("policy_id", params.policyId)
    .eq("due_date", dueStr)
    .eq("status", "pending");

  const rows = REMINDER_SCHEDULE.map((r) => {
    const due = new Date(dueStr);
    const reminderDate = subDays(due, r.daysBeforeDue);
    return {
      tenant_id: params.tenantId,
      policy_id: params.policyId,
      customer_id: params.customerId,
      agent_id: params.agentId,
      due_date: dueStr,
      reminder_date: format(reminderDate, "yyyy-MM-dd"),
      days_before_due: r.daysBeforeDue,
      channel: [...r.channels],
      status: "pending",
    };
  });

  const { error } = await admin.from("premium_reminders").insert(rows);
  if (error) console.error("[generateReminders]", error.message);
}
