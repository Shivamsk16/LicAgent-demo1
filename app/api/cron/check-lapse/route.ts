import { verifyCronRequest, cronUnauthorized } from "@/lib/cron/verify";
import { runLapseCheck } from "@/lib/business/policy-lifecycle";
import { apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) return cronUnauthorized();
  const result = await runLapseCheck();
  return apiSuccess(result);
}

export const POST = GET;
