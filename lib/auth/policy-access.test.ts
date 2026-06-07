import { describe, expect, it, vi } from "vitest";
import {
  fetchCustomerInTenant,
  fetchPolicyForContext,
} from "@/lib/auth/policy-access";

type Row = Record<string, unknown>;

function createQueryMock(result: Row | null) {
  const chain: Record<string, unknown> = {};
  const terminal = vi.fn().mockResolvedValue({ data: result, error: null });

  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = terminal;
  chain.single = terminal;

  return {
    from: vi.fn().mockReturnValue(chain),
    chain,
    terminal,
  };
}

describe("fetchPolicyForContext", () => {
  it("scopes non-managers to their own policies", async () => {
    const mock = createQueryMock({
      id: "policy-1",
      agent_id: "agent-1",
      customer_id: "cust-1",
    });

    const result = await fetchPolicyForContext(
      mock as unknown as ReturnType<
        typeof import("@/lib/supabase/admin").createAdminClient
      >,
      "policy-1",
      { tenantId: "tenant-1", userId: "agent-1", isManager: false }
    );

    expect(result?.id).toBe("policy-1");
    expect(mock.chain.eq).toHaveBeenCalledWith("agent_id", "agent-1");
  });

  it("does not filter by agent for managers", async () => {
    const mock = createQueryMock({
      id: "policy-2",
      agent_id: "agent-2",
      customer_id: "cust-2",
    });

    await fetchPolicyForContext(
      mock as unknown as ReturnType<
        typeof import("@/lib/supabase/admin").createAdminClient
      >,
      "policy-2",
      { tenantId: "tenant-1", userId: "manager-1", isManager: true }
    );

    const eqCalls = (mock.chain.eq as ReturnType<typeof vi.fn>).mock.calls;
    expect(eqCalls.some(([col]) => col === "agent_id")).toBe(false);
  });

  it("returns null when policy not found", async () => {
    const mock = createQueryMock(null);
    const result = await fetchPolicyForContext(
      mock as unknown as ReturnType<
        typeof import("@/lib/supabase/admin").createAdminClient
      >,
      "missing",
      { tenantId: "tenant-1", userId: "agent-1", isManager: false }
    );
    expect(result).toBeNull();
  });
});

describe("fetchCustomerInTenant", () => {
  it("requires tenant match", async () => {
    const mock = createQueryMock({ id: "cust-1", assigned_agent_id: "agent-1" });

    await fetchCustomerInTenant(
      mock as unknown as ReturnType<
        typeof import("@/lib/supabase/admin").createAdminClient
      >,
      "cust-1",
      "tenant-1"
    );

    expect(mock.chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
  });

  it("enforces agent assignment when required", async () => {
    const mock = createQueryMock({ id: "cust-1", assigned_agent_id: "agent-1" });

    await fetchCustomerInTenant(
      mock as unknown as ReturnType<
        typeof import("@/lib/supabase/admin").createAdminClient
      >,
      "cust-1",
      "tenant-1",
      { requireAssignedAgentId: "agent-1" }
    );

    expect(mock.chain.eq).toHaveBeenCalledWith(
      "assigned_agent_id",
      "agent-1"
    );
  });
});
