import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, format } from "date-fns";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const { action } = await request.json();
  const admin = createAdminClient();

  if (action === "dismiss") {
    const { data } = await admin
      .from("premium_reminders")
      .update({ status: "dismissed" })
      .eq("id", params.id)
      .eq("tenant_id", ctx.tenantId)
      .select()
      .single();
    return apiSuccess(data);
  }

  if (action === "snooze") {
    const { data: reminder } = await admin
      .from("premium_reminders")
      .select("reminder_date")
      .eq("id", params.id)
      .single();

    const newDate = format(
      addDays(new Date(reminder!.reminder_date), 7),
      "yyyy-MM-dd"
    );

    const { data } = await admin
      .from("premium_reminders")
      .update({ reminder_date: newDate, status: "pending" })
      .eq("id", params.id)
      .select()
      .single();
    return apiSuccess(data);
  }

  return apiError("VALIDATION_ERROR", "Unknown action", 400);
}
