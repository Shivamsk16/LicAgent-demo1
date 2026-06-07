import { describe, expect, it } from "vitest";
import {
  denialToContextError,
  denialToPath,
  getTenantAccessDenial,
} from "@/lib/auth/tenant-access";

describe("getTenantAccessDenial", () => {
  it("returns null for active non-expired trial", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(
      getTenantAccessDenial({
        status: "active",
        plan: "trial",
        trial_ends_at: future,
      })
    ).toBeNull();
  });

  it("returns trial_expired when trial date passed", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(
      getTenantAccessDenial({
        status: "active",
        plan: "trial",
        trial_ends_at: past,
      })
    ).toBe("trial_expired");
  });

  it("returns account_suspended for suspended tenants", () => {
    expect(
      getTenantAccessDenial({
        status: "suspended",
        plan: "pro",
        trial_ends_at: null,
      })
    ).toBe("account_suspended");
  });

  it("returns inactive for cancelled tenants", () => {
    expect(
      getTenantAccessDenial({
        status: "cancelled",
        plan: "pro",
        trial_ends_at: null,
      })
    ).toBe("inactive");
  });
});

describe("denialToPath", () => {
  it("maps denials to dedicated recovery pages", () => {
    expect(denialToPath("trial_expired")).toBe("/trial-expired");
    expect(denialToPath("account_suspended")).toBe("/account-suspended");
  });
});

describe("denialToContextError", () => {
  it("maps denials to dashboard context errors", () => {
    expect(denialToContextError("trial_expired")).toBe("TRIAL_EXPIRED");
    expect(denialToContextError("account_suspended")).toBe("ACCOUNT_SUSPENDED");
    expect(denialToContextError("inactive")).toBe("FORBIDDEN");
  });
});
