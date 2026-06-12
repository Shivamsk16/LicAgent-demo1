import { describe, expect, it } from "vitest";
import {
  ALTERNATE_PHONE_DIFF_MESSAGE,
  customerSchema,
  digitsOnly,
  EMAIL_MESSAGE,
  PHONE_MESSAGE,
} from "./customer";

const validCustomer = {
  full_name: "Tarun Saini",
  phone: "9876543210",
  alternate_phone: "",
  email: "",
  city: "Mumbai",
  state: "Maharashtra",
};

describe("digitsOnly", () => {
  it("strips non-digits and caps length", () => {
    expect(digitsOnly("abc98765xyz43210")).toBe("9876543210");
    expect(digitsOnly("987654321012345")).toBe("9876543210");
  });
});

describe("customerSchema phone", () => {
  it("rejects 9 digits", () => {
    const result = customerSchema.safeParse({ ...validCustomer, phone: "987654321" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(PHONE_MESSAGE);
    }
  });

  it("rejects 11 digits", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      phone: "98765432101",
    });
    expect(result.success).toBe(false);
  });

  it("rejects letters", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      phone: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects symbols", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      phone: "98765-4321",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid Indian mobile", () => {
    const result = customerSchema.safeParse(validCustomer);
    expect(result.success).toBe(true);
  });
});

describe("customerSchema email", () => {
  it("rejects invalid email", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      email: "tarunsaini",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(EMAIL_MESSAGE);
    }
  });

  it("rejects incomplete email", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      email: "abc@",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid email", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      email: "abc@gmail.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("customerSchema alternate phone", () => {
  it("rejects when same as primary", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      alternate_phone: "9876543210",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(ALTERNATE_PHONE_DIFF_MESSAGE);
    }
  });
});
