import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants/states";

export const PHONE_MESSAGE = "Please enter a valid 10-digit phone number";
export const EMAIL_MESSAGE = "Please enter a valid email address";
export const ALTERNATE_PHONE_DIFF_MESSAGE =
  "Alternate phone must be different from phone number";

export const phoneSchema = z
  .string()
  .min(1, PHONE_MESSAGE)
  .regex(/^[6-9]\d{9}$/, PHONE_MESSAGE);

export const optionalPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, PHONE_MESSAGE)
  .optional()
  .or(z.literal(""));

export const emailSchema = z
  .string()
  .email(EMAIL_MESSAGE)
  .optional()
  .or(z.literal(""));

const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format")
  .optional()
  .or(z.literal(""));

const customerBaseFields = {
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z
    .enum(["single", "married", "widowed", "divorced"])
    .optional(),
  occupation: z.string().optional(),
  phone: phoneSchema,
  alternate_phone: optionalPhoneSchema,
  email: emailSchema,
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
  pan_number: panSchema,
  aadhaar_last4: z
    .string()
    .regex(/^\d{4}$/, "Enter last 4 digits")
    .optional()
    .or(z.literal("")),
  nominee_name: z.string().optional(),
  nominee_relation: z.string().optional(),
  nominee_dob: z.string().optional(),
  notes: z.string().optional(),
};

const alternatePhoneRefine = {
  message: ALTERNATE_PHONE_DIFF_MESSAGE,
  path: ["alternate_phone"],
};

/** API object without cross-field refine (for step picks). */
export const customerApiObjectSchema = z.object({
  ...customerBaseFields,
  annual_income: z.number().optional(),
});

/** API payload schema (annual_income as number). */
export const customerSchema = customerApiObjectSchema.refine((data) => {
  const alt = data.alternate_phone?.trim();
  if (!alt) return true;
  return data.phone !== alt;
}, alternatePhoneRefine);

/** Same rules as create — full replace on PUT. */
export const customerUpdateSchema = customerSchema;

/** Form object without cross-field refine (for step picks). */
export const customerFormObjectSchema = z.object({
  ...customerBaseFields,
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  annual_income: z.string().optional(),
});

/** Wizard / manual form schema (annual_income as string). */
export const customerFormSchema = customerFormObjectSchema.refine((data) => {
  const alt = data.alternate_phone?.trim();
  if (!alt) return true;
  return data.phone !== alt;
}, alternatePhoneRefine);

export type CustomerApiInput = z.infer<typeof customerSchema>;
export type CustomerFormInput = z.infer<typeof customerFormSchema>;

/** Strip non-digits and cap length for phone inputs. */
export function digitsOnly(value: string, max = 10) {
  return value.replace(/\D/g, "").slice(0, max);
}

/** Map Zod safeParse failure to API error parts. */
export function zodValidationError(result: z.ZodSafeParseError<unknown>) {
  const issue = result.error.issues[0];
  const field =
    issue?.path?.length ? String(issue.path[0]) : undefined;
  return {
    message: issue?.message ?? "Validation failed",
    field,
  };
}
