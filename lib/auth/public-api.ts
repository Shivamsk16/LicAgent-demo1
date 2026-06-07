/** API routes reachable without a session (onboarding, health). */
const PUBLIC_API_PREFIXES = ["/api/auth/accept-invite", "/api/health"] as const;

export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldApiReturnUnauthorized(
  pathname: string,
  hasUser: boolean
): boolean {
  return pathname.startsWith("/api/") && !hasUser && !isPublicApiRoute(pathname);
}
