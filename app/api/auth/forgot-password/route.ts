import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getPasswordResetCallbackUrl } from "@/lib/auth/app-url";
import { createClient } from "@/lib/supabase/server";

const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email required"),
});

/** Server-side password reset so redirectTo uses runtime NEXT_PUBLIC_APP_URL. */
export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getPasswordResetCallbackUrl(),
  });

  if (error) {
    return apiError("AUTH_ERROR", error.message, 400);
  }

  return apiSuccess({ sent: true });
}
