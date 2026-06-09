import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants/states";

const phoneField = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number");

export const customerWizardSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  occupation: z.string().optional(),
  annual_income: z.string().optional(),
  phone: phoneField,
  alternate_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z
    .string()
    .min(1, "State is required")
    .refine((s) =>
      INDIAN_STATES.includes(s as (typeof INDIAN_STATES)[number])
    ),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be 6 digits")
    .optional()
    .or(z.literal("")),
  pan_number: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  aadhaar_last4: z
    .string()
    .regex(/^\d{4}$/, "Enter last 4 digits")
    .optional()
    .or(z.literal("")),
  nominee_name: z.string().optional(),
  nominee_relation: z.string().optional(),
  nominee_dob: z.string().optional(),
  notes: z.string().optional(),
});

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
