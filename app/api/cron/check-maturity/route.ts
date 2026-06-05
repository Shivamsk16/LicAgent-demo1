import { verifyCronRequest, cronUnauthorized } from "@/lib/cron/verify";
import { runMaturityCheck } from "@/lib/business/policy-lifecycle";
import { apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) return cronUnauthorized();
  const result = await runMaturityCheck();
  return apiSuccess(result);
}

export const POST = GET;
