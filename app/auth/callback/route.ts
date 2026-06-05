import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/auth/app-url";

/** PKCE / magic-link code exchange (query ?code=). Hash-based invites use /invite/complete. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/invite/complete";
  const origin = getAppUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
