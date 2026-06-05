import { verifyCronRequest, cronUnauthorized } from "@/lib/cron/verify";
import { runRevivalDeadlineWarnings } from "@/lib/business/policy-lifecycle";
import { apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) return cronUnauthorized();
  const result = await runRevivalDeadlineWarnings();
  return apiSuccess(result);
}

export const POST = GET;
