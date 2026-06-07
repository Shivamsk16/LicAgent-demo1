import { describe, expect, it } from "vitest";
import {
  isPublicApiRoute,
  shouldApiReturnUnauthorized,
} from "@/lib/auth/public-api";

describe("isPublicApiRoute", () => {
  it("allows accept-invite onboarding API", () => {
    expect(isPublicApiRoute("/api/auth/accept-invite")).toBe(true);
  });

  it("allows health check", () => {
    expect(isPublicApiRoute("/api/health")).toBe(true);
  });

  it("denies protected dashboard APIs", () => {
    expect(isPublicApiRoute("/api/dashboard/stats")).toBe(false);
    expect(isPublicApiRoute("/api/payments")).toBe(false);
    expect(isPublicApiRoute("/api/auth/activate-membership")).toBe(false);
  });
});

describe("shouldApiReturnUnauthorized", () => {
  it("returns true for unauthenticated protected API", () => {
    expect(shouldApiReturnUnauthorized("/api/customers", false)).toBe(true);
  });

  it("returns false for public onboarding API when logged out", () => {
    expect(shouldApiReturnUnauthorized("/api/auth/accept-invite", false)).toBe(
      false
    );
  });

  it("returns false for authenticated API calls", () => {
    expect(shouldApiReturnUnauthorized("/api/customers", true)).toBe(false);
  });
});
