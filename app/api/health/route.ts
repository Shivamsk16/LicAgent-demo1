import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    cronSecret: Boolean(process.env.CRON_SECRET),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  };

  const ok = checks.supabaseUrl && checks.supabaseAnon && checks.serviceRole;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: ok ? 200 : 503 }
  );
}
