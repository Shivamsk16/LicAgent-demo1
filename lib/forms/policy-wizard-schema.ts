import { z } from "zod";

const policyTypeEnum = z.enum([
  "endowment",
  "whole_life",
  "term",
  "money_back",
  "ulip",
  "pension",
  "child",
  "group",
]);

const premiumFrequencyEnum = z.enum([
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
  "single",
]);

const paymentModeEnum = z.enum([
  "cash",
  "cheque",
  "neft",
  "nach",
  "upi",
  "online",
]);

export const policyWizardSchema = z.object({
  customer_id: z.string().uuid("Select a customer"),
  policy_number: z.string().min(3, "Policy number is required"),
  plan_name: z.string().min(2, "Plan name is required"),
  plan_code: z.string().optional(),
  policy_type: policyTypeEnum,
  sum_assured: z
    .string()
    .min(1, "Sum assured is required")
    .refine((v) => Number(v) > 0, "Sum assured must be greater than 0"),
  premium_amount: z
    .string()
    .min(1, "Premium is required")
    .refine((v) => Number(v) > 0, "Premium must be greater than 0"),
  premium_frequency: premiumFrequencyEnum,
  policy_term_years: z
    .string()
    .min(1, "Term is required")
    .refine((v) => Number(v) > 0, "Term must be greater than 0"),
  premium_term_years: z.string().optional(),
  commencement_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Commencement date is required"),
  maturity_date: z.string().optional(),
  mode_of_payment: paymentModeEnum,
  notes: z.string().optional(),
});

export type PolicyWizardFormValues = z.infer<typeof policyWizardSchema>;

export const policyWizardStep0Schema = policyWizardSchema.pick({
  customer_id: true,
});

export const policyWizardStep1Schema = policyWizardSchema.pick({
  policy_number: true,
  plan_name: true,
  policy_type: true,
  sum_assured: true,
});

export const policyWizardStep2Schema = policyWizardSchema.pick({
  premium_amount: true,
  premium_frequency: true,
  policy_term_years: true,
  commencement_date: true,
  mode_of_payment: true,
});

export const POLICY_WIZARD_STEP_FIELDS = [
  ["customer_id"],
  ["policy_number", "plan_name", "policy_type", "sum_assured"],
  [
    "premium_amount",
    "premium_frequency",
    "policy_term_years",
    "commencement_date",
    "mode_of_payment",
  ],
  [],
] as const;

export const POLICY_WIZARD_STEPS = [
  { id: 0, label: "Customer" },
  { id: 1, label: "Policy Details" },
  { id: 2, label: "Premium Details" },
  { id: 3, label: "Review" },
] as const;

export const POLICY_WIZARD_DRAFT_KEY = "lic-policy-wizard-draft";

export function policyWizardDefaultValues(
  prefillCustomerId?: string | null
): PolicyWizardFormValues {
  return {
    customer_id: prefillCustomerId ?? "",
    policy_number: "",
    plan_name: "",
    plan_code: "",
    policy_type: "endowment",
    sum_assured: "",
    premium_amount: "",
    premium_frequency: "yearly",
    policy_term_years: "20",
    premium_term_years: "20",
    commencement_date: new Date().toISOString().slice(0, 10),
    maturity_date: "",
    mode_of_payment: "cash",
    notes: "",
  };
}

export function policyWizardPayload(values: PolicyWizardFormValues) {
  return {
    ...values,
    sum_assured: Number(values.sum_assured),
    premium_amount: Number(values.premium_amount),
    premium_term_years: Number(values.premium_term_years || values.policy_term_years),
    policy_term_years: Number(values.policy_term_years),
    plan_code: values.plan_code || undefined,
    maturity_date: values.maturity_date || undefined,
    notes: values.notes || undefined,
  };
}
