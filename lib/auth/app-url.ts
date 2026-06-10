/** Canonical app base URL for redirects (no trailing slash). */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/** Supabase resetPasswordForEmail redirect — PKCE code lands on /auth/callback. */
export function getPasswordResetCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback?next=/reset-password`;
}

/** Supabase inviteUserByEmail redirect — hash tokens land here. */
export function getInviteCompleteUrl(): string {
  return `${getAppUrl()}/invite/complete`;
}

/** Branded Resend email link for app invitation token. */
export function getInviteTokenUrl(token: string): string {
  return `${getAppUrl()}/invite/${token}`;
}
