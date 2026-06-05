import { NextResponse } from "next/server";

export function verifyCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export function cronUnauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
