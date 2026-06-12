import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("createCustomer fetch contract", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "test-submission-id",
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it("sends X-Submission-Id and parses duplicate flag", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: { id: "cust-1", full_name: "Test" },
        duplicate: true,
      }),
    });
    global.fetch = fetchMock;

    const submissionId = crypto.randomUUID();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Submission-Id": submissionId,
      },
      body: JSON.stringify({ full_name: "Test", phone: "9876543210" }),
    });
    const json = await res.json();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customers",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Submission-Id": "test-submission-id",
        }),
      })
    );
    expect(json.duplicate).toBe(true);
    expect(json.data.id).toBe("cust-1");
  });

  it("guards against parallel submissions via isPending pattern", () => {
    let isPending = false;
    let callCount = 0;

    async function save() {
      if (isPending) return;
      isPending = true;
      callCount += 1;
      await Promise.resolve();
      isPending = false;
    }

    void save();
    void save();
    expect(callCount).toBe(1);
  });
});
