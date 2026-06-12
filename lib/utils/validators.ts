import { z } from "zod";

export {
  customerSchema,
  customerUpdateSchema,
  customerFormSchema,
  customerApiObjectSchema,
} from "@/lib/validation/customer";

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
