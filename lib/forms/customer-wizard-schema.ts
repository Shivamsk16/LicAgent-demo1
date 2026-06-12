import { customerFormSchema } from "@/lib/validation/customer";
import type { z } from "zod";

export const customerWizardSchema = customerFormSchema;

export type CustomerWizardFormValues = z.infer<typeof customerWizardSchema>;

export const CUSTOMER_WIZARD_STEP_FIELDS = [
  ["full_name", "phone", "email", "alternate_phone"],
  ["city", "state", "pincode", "pan_number", "aadhaar_last4"],
  ["nominee_name", "nominee_relation", "nominee_dob", "notes"],
  [],
] as const;

export const CUSTOMER_WIZARD_STEPS = [
  { id: 0, label: "Personal" },
  { id: 1, label: "Address" },
  { id: 2, label: "Nominee" },
  { id: 3, label: "Review" },
] as const;

export const CUSTOMER_WIZARD_DRAFT_KEY = "lic-customer-wizard-draft";

export function customerWizardDefaultValues(): CustomerWizardFormValues {
  return {
    full_name: "",
    date_of_birth: "",
    gender: "",
    marital_status: "",
    occupation: "",
    annual_income: "",
    phone: "",
    alternate_phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    pan_number: "",
    aadhaar_last4: "",
    nominee_name: "",
    nominee_relation: "",
    nominee_dob: "",
    notes: "",
  };
}

export function customerWizardApiPayload(values: CustomerWizardFormValues) {
  return {
    ...values,
    annual_income: values.annual_income ? Number(values.annual_income) : undefined,
    gender: values.gender || undefined,
    marital_status: values.marital_status || undefined,
    email: values.email || "",
    alternate_phone: values.alternate_phone || "",
    pincode: values.pincode || "",
    pan_number: values.pan_number || "",
    aadhaar_last4: values.aadhaar_last4 || "",
  };
}
