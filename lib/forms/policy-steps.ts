import { z } from "zod";

export const policyStep0Schema = z.object({
  customer_id: z.string().uuid("Select a customer"),
});

export const policyStep1Schema = z.object({
  policy_number: z.string().min(3, "Policy number is required"),
  plan_name: z.string().min(2, "Plan name is required"),
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
  sum_assured: z
    .string()
    .min(1, "Sum assured is required")
    .refine((v) => Number(v) > 0, "Sum assured must be greater than 0"),
  premium_amount: z
    .string()
    .min(1, "Premium is required")
    .refine((v) => Number(v) > 0, "Premium must be greater than 0"),
  premium_frequency: z.enum([
    "monthly",
    "quarterly",
    "half_yearly",
    "yearly",
    "single",
  ]),
  policy_term_years: z
    .string()
    .min(1, "Term is required")
    .refine((v) => Number(v) > 0, "Term must be greater than 0"),
  commencement_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Commencement date is required"),
});

export type PolicyFormValues = {
  customer_id: string;
  policy_number: string;
  plan_name: string;
  plan_code: string;
  policy_type: string;
  sum_assured: string;
  premium_amount: string;
  premium_frequency: string;
  policy_term_years: string;
  premium_term_years: string;
  commencement_date: string;
  maturity_date: string;
  mode_of_payment: string;
  notes: string;
};
