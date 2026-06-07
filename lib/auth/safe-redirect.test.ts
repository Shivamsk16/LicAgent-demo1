import { describe, expect, it } from "vitest";
import { sanitizeRedirectPath } from "@/lib/auth/safe-redirect";

describe("sanitizeRedirectPath", () => {
  it("returns fallback for null/undefined/empty", () => {
    expect(sanitizeRedirectPath(null)).toBe("/dashboard");
    expect(sanitizeRedirectPath(undefined)).toBe("/dashboard");
    expect(sanitizeRedirectPath("")).toBe("/dashboard");
    expect(sanitizeRedirectPath("   ")).toBe("/dashboard");
  });

  it("allows safe internal paths", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/select-tenant")).toBe("/select-tenant");
    expect(sanitizeRedirectPath("/dashboard/customers?id=1")).toBe(
      "/dashboard/customers?id=1"
    );
  });

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.com/path")).toBe("/dashboard");
  });

  it("rejects external and absolute URLs", () => {
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("http://evil.com/phish")).toBe("/dashboard");
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects paths without leading slash", () => {
    expect(sanitizeRedirectPath("dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("evil.com")).toBe("/dashboard");
  });

  it("uses custom fallback", () => {
    expect(sanitizeRedirectPath("//x", "/invite/complete")).toBe(
      "/invite/complete"
    );
  });
});
