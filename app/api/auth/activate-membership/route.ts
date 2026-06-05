import { createClient } from "@/lib/supabase/server";
import { activateMembershipForUser } from "@/lib/auth/invitation";
import { apiError, apiSuccess } from "@/lib/api/response";

/** Called after Supabase hash session is established on /invite/complete */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return apiError("UNAUTHORIZED", "Not signed in", 401);
  }

  let invitationToken: string | undefined;
  try {
    const body = await request.json();
    invitationToken = body?.token;
  } catch {
    /* no body */
  }

  const result = await activateMembershipForUser({
    userId: user.id,
    email: user.email,
    invitationToken,
    actorId: user.id,
  });

  if (result.error) return apiError("SERVER_ERROR", result.error, 500);

  const res = apiSuccess({
    tenantId: result.tenantId,
    redirectTo: result.tenantId ? "/dashboard" : "/login?error=no_tenant",
  });

  if (result.tenantId) {
    res.cookies.set("active_tenant", result.tenantId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return res;
}
