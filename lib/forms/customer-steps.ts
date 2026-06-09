import { z } from "zod";
import { customerSchema } from "@/lib/utils/validators";

export const customerStep0Schema = customerSchema.pick({
  full_name: true,
  phone: true,
  email: true,
});

export const customerStep1Schema = customerSchema.pick({
  city: true,
  state: true,
  pincode: true,
  pan_number: true,
  aadhaar_last4: true,
});

export const customerStep2Schema = z.object({
  nominee_name: z.string().optional(),
  nominee_relation: z.string().optional(),
  nominee_dob: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormValues = {
  full_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  annual_income: string;
  phone: string;
  alternate_phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  pan_number: string;
  aadhaar_last4: string;
  nominee_name: string;
  nominee_relation: string;
  nominee_dob: string;
  notes: string;
};

export function customerPayloadForValidation(form: CustomerFormValues) {
  return {
    ...form,
    annual_income: form.annual_income ? Number(form.annual_income) : undefined,
    gender: form.gender || undefined,
    marital_status: form.marital_status || undefined,
    email: form.email || "",
    alternate_phone: form.alternate_phone || "",
    pincode: form.pincode || "",
    pan_number: form.pan_number || "",
    aadhaar_last4: form.aadhaar_last4 || "",
  };
}
