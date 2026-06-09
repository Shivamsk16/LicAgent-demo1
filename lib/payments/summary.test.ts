import { describe, expect, it } from "vitest";
import { buildPaymentsSummaryParams } from "./summary";
import type { DashboardContext } from "@/lib/auth/dashboard-context";

const baseCtx = {
  userId: "user-1",
  email: "a@b.com",
  tenantId: "tenant-1",
  role: "agent",
  isManager: false,
  tenant: {} as DashboardContext["tenant"],
  membershipCount: 1,
} satisfies DashboardContext;

describe("buildPaymentsSummaryParams", () => {
  it("maps agent scope and filters from search params", () => {
    const params = new URLSearchParams({
      status: "paid",
      from: "2025-01-01",
      to: "2025-12-31",
      customer_id: "cust-1",
      policy_id: "pol-1",
      search: "RCP-99",
    });

    expect(buildPaymentsSummaryParams(baseCtx, params)).toEqual({
      tenantId: "tenant-1",
      recordedBy: "user-1",
      isManager: false,
      agentId: null,
      status: "paid",
      from: "2025-01-01",
      to: "2025-12-31",
      customerId: "cust-1",
      policyId: "pol-1",
      search: "RCP-99",
    });
  });

  it("passes manager agent filter", () => {
    const managerCtx = { ...baseCtx, isManager: true, role: "branch_manager" as const };
    const params = new URLSearchParams({ agent_id: "agent-9" });

    expect(buildPaymentsSummaryParams(managerCtx, params).agentId).toBe("agent-9");
  });
});
