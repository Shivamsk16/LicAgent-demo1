import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activateMembershipForUser,
  getInvitationByToken,
  validateInvitation,
} from "@/lib/auth/invitation";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return apiError("VALIDATION_ERROR", "Token required", 400);

  const { invitation, error } = await getInvitationByToken(token);
  if (error || !invitation) {
    return apiError("NOT_FOUND", error ?? "Invitation not found", 404);
  }

  const validation = validateInvitation(invitation);
  if (validation) {
    return apiSuccess({
      valid: false,
      error: validation,
      email: invitation.email,
      branchName: invitation.tenant?.name,
    });
  }

  return apiSuccess({
    valid: true,
    email: invitation.email,
    branchName: invitation.tenant?.name,
    branchLocation: [invitation.tenant?.city, invitation.tenant?.state]
      .filter(Boolean)
      .join(", "),
    roleName: invitation.role?.display_name ?? invitation.role?.name,
    expiresAt: invitation.expires_at,
  });
}

const acceptSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = acceptSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const { token, password, full_name, phone } = parsed.data;
  const { invitation, error } = await getInvitationByToken(token);
  if (error || !invitation) {
    return apiError("NOT_FOUND", error ?? "Invitation not found", 404);
  }

  const validation = validateInvitation(invitation);
  if (validation) return apiError("BAD_REQUEST", validation, 400);

  const admin = createAdminClient();
  const email = invitation.email.toLowerCase();

  let userId: string;
  const { data: existingProfile } = await admin
    .from("users")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const authUser = authList?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (authUser) {
      userId = authUser.id;
    } else {
      userId = "";
    }
  }

  if (userId) {
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name ?? existingProfile?.full_name ?? email.split("@")[0],
      },
    });
    if (updateError) {
      return apiError("SERVER_ERROR", updateError.message, 500);
    }
    await admin.from("users").upsert({
      id: userId,
      email,
      full_name: full_name ?? existingProfile?.full_name ?? email.split("@")[0],
      phone: phone ?? null,
      super_admin: false,
      email_verified: true,
    });
  } else {
    const { data: authUser, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name ?? email.split("@")[0] },
      });
    if (createError || !authUser.user) {
      return apiError("SERVER_ERROR", createError?.message ?? "Failed to create user", 500);
    }
    userId = authUser.user.id;
    await admin.from("users").insert({
      id: userId,
      email,
      full_name: full_name ?? email.split("@")[0],
      phone: phone ?? null,
      super_admin: false,
      email_verified: true,
    });
  }

  if (full_name || phone) {
    await admin
      .from("users")
      .update({
        ...(full_name && { full_name }),
        ...(phone && { phone }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  const result = await activateMembershipForUser({
    userId,
    email,
    invitationToken: token,
    actorId: userId,
  });

  if (result.error) return apiError("SERVER_ERROR", result.error, 500);

  const res = apiSuccess({
    email,
    tenantId: result.tenantId,
    message: "Account activated. Sign in with your new password.",
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
