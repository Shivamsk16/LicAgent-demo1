import { describe, expect, it } from "vitest";
import { apiUnauthorizedResponse } from "@/lib/api/unauthorized";

describe("apiUnauthorizedResponse", () => {
  it("returns JSON 401 with standard shape", async () => {
    const res = apiUnauthorizedResponse();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not signed in" },
    });
  });
});
