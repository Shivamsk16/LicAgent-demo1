import { verifyCronRequest, cronUnauthorized } from "@/lib/cron/verify";
import { runSendReminders } from "@/lib/business/send-reminders";
import { apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) return cronUnauthorized();
  const result = await runSendReminders();
  return apiSuccess(result);
}

export const POST = GET;
