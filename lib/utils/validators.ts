import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants/states";

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number");
const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format")
  .optional()
  .or(z.literal(""));

export const customerSchema = z.object({
  full_name: z.string().min(2),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z.enum(["single", "married", "widowed", "divorced"]).optional(),
  occupation: z.string().optional(),
  annual_income: z.number().optional(),
  phone: phoneSchema,
  alternate_phone: phoneSchema.optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().refine((s) => INDIAN_STATES.includes(s as (typeof INDIAN_STATES)[number])),
  pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal("")),
  pan_number: panSchema,
  aadhaar_last4: z.string().regex(/^\d{4}$/).optional().or(z.literal("")),
  nominee_name: z.string().optional(),
  nominee_relation: z.string().optional(),
  nominee_dob: z.string().optional(),
  notes: z.string().optional(),
});

export const policySchema = z.object({
  customer_id: z.string().uuid(),
  policy_number: z.string().min(3),
  plan_name: z.string().min(2),
  plan_code: z.string().optional(),
  policy_type: z.enum([
    "endowment",
    "whole_life",
    "term",
    "money_back",
    "ulip",
    "pension",
    "child",
    "group",
  ]),
  sum_assured: z.number().positive(),
  premium_amount: z.number().positive(),
  premium_frequency: z.enum([
    "monthly",
    "quarterly",
    "half_yearly",
    "yearly",
    "single",
  ]),
  premium_term_years: z.number().int().positive().optional(),
  policy_term_years: z.number().int().positive().optional(),
  commencement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maturity_date: z.string().optional(),
  mode_of_payment: z
    .enum(["cash", "cheque", "neft", "nach", "upi", "online"])
    .optional(),
  branch_office: z.string().optional(),
  division_code: z.string().optional(),
  notes: z.string().optional(),
  rider_details: z.array(z.object({}).passthrough()).optional(),
});

export const paymentSchema = z.object({
  policy_id: z.string().uuid(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount_due: z.number().positive(),
  amount_paid: z.number().positive("Amount paid must be > 0"),
  installment_number: z.number().int().positive(),
  payment_mode: z.enum([
    "cash",
    "cheque",
    "neft",
    "nach",
    "upi",
    "online",
    "dd",
  ]),
  receipt_number: z.string().optional(),
  late_fee: z.number().min(0).optional(),
  remarks: z.string().optional(),
});
