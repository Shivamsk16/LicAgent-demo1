import { describe, expect, it } from "vitest";
import { validateStep } from "./step-validation";
import { customerStep0Schema, customerStep1Schema } from "./customer-steps";

describe("customer step validation", () => {
  it("blocks step 0 without required fields", () => {
    const result = validateStep(customerStep0Schema, {
      full_name: "",
      phone: "12345",
      alternate_phone: "",
      email: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.full_name).toBeDefined();
      expect(result.firstField).toBe("full_name");
    }
  });

  it("allows step 1 with valid city and state", () => {
    const result = validateStep(customerStep1Schema, {
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "",
      pan_number: "",
      aadhaar_last4: "",
    });
    expect(result.ok).toBe(true);
  });
});
