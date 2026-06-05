import { verifyCronRequest, cronUnauthorized } from "@/lib/cron/verify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create";
import { apiSuccess } from "@/lib/api/response";
import { addDays, format } from "date-fns";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) return cronUnauthorized();

  const admin = createAdminClient();
  const warnDate = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const { data: expiring } = await admin
    .from("tenants")
    .select("id, name, trial_ends_at")
    .eq("plan", "trial")
    .eq("status", "active")
    .lte("trial_ends_at", warnDate);

  const { data: superAdmins } = await admin
    .from("users")
    .select("id")
    .eq("super_admin", true);

  for (const t of expiring ?? []) {
    for (const sa of superAdmins ?? []) {
      await createNotification({
        tenantId: t.id,
        userId: sa.id,
        type: "premium_due",
        title: `Trial expiring: ${t.name}`,
        body: `Ends ${t.trial_ends_at}`,
        link: `/superadmin/tenants/${t.id}/settings`,
      });
    }
  }

  return apiSuccess({ warned: expiring?.length ?? 0 });
}

export const POST = GET;
