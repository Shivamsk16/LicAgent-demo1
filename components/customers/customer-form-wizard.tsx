"use client";

import {
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { ReviewSummary, formatLabel } from "@/components/shared/review-summary";
import { formatINR } from "@/lib/utils/currency";
import { INDIAN_STATES } from "@/lib/constants/states";
import { fieldErrorClass } from "@/lib/forms/step-validation";
import type { CustomerWizardFormValues } from "@/lib/forms/customer-wizard-schema";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-lic-red-600" role="alert">
      {message}
    </p>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{children}</div>
  );
}

function FormColumn({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

export function CustomerFormWizard({
  step,
  register,
  errors,
  values,
  submitError,
  formId,
  onSubmit,
}: {
  step: number;
  register: UseFormRegister<CustomerWizardFormValues>;
  errors: FieldErrors<CustomerWizardFormValues>;
  values: CustomerWizardFormValues;
  submitError?: string;
  formId: string;
  onSubmit: () => void;
}) {
  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="mx-auto w-full max-w-4xl"
      noValidate
    >
      {step === 0 && (
        <FormGrid>
          <FormColumn>
            <div>
              <Label htmlFor="field-full_name" required>
                Full name
              </Label>
              <Input
                id="field-full_name"
                {...register("full_name")}
                className={fieldErrorClass(!!errors.full_name)}
                aria-invalid={!!errors.full_name}
              />
              <FieldError message={errors.full_name?.message} />
            </div>
            <div>
              <Label htmlFor="field-date_of_birth">Date of birth</Label>
              <Input
                id="field-date_of_birth"
                type="date"
                {...register("date_of_birth")}
              />
            </div>
            <div>
              <Label htmlFor="field-gender">Gender</Label>
              <Select
                id="field-gender"
                containerClassName="w-full"
                {...register("gender")}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="field-marital_status">Marital status</Label>
              <Select
                id="field-marital_status"
                containerClassName="w-full"
                {...register("marital_status")}
              >
                <option value="">Select</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="divorced">Divorced</option>
              </Select>
            </div>
          </FormColumn>
          <FormColumn>
            <div>
              <Label htmlFor="field-phone" required>
                Phone
              </Label>
              <Input
                id="field-phone"
                {...register("phone")}
                className={fieldErrorClass(!!errors.phone)}
                aria-invalid={!!errors.phone}
              />
              <FieldError message={errors.phone?.message} />
            </div>
            <div>
              <Label htmlFor="field-alternate_phone">Alternate phone</Label>
              <Input
                id="field-alternate_phone"
                {...register("alternate_phone")}
                className={fieldErrorClass(!!errors.alternate_phone)}
              />
              <FieldError message={errors.alternate_phone?.message} />
            </div>
            <div>
              <Label htmlFor="field-email">Email</Label>
              <Input
                id="field-email"
                type="email"
                {...register("email")}
                className={fieldErrorClass(!!errors.email)}
              />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="field-occupation">Occupation</Label>
              <Input id="field-occupation" {...register("occupation")} />
            </div>
            <div>
              <Label htmlFor="field-annual_income">Annual income (₹)</Label>
              <Input
                id="field-annual_income"
                type="number"
                {...register("annual_income")}
              />
            </div>
          </FormColumn>
        </FormGrid>
      )}

      {step === 1 && (
        <FormGrid>
          <FormColumn>
            <div>
              <Label htmlFor="field-address_line1">Address line 1</Label>
              <Input id="field-address_line1" {...register("address_line1")} />
            </div>
            <div>
              <Label htmlFor="field-address_line2">Address line 2</Label>
              <Input id="field-address_line2" {...register("address_line2")} />
            </div>
            <div>
              <Label htmlFor="field-city" required>
                City
              </Label>
              <Input
                id="field-city"
                {...register("city")}
                className={fieldErrorClass(!!errors.city)}
                aria-invalid={!!errors.city}
              />
              <FieldError message={errors.city?.message} />
            </div>
          </FormColumn>
          <FormColumn>
            <div>
              <Label htmlFor="field-state" required>
                State
              </Label>
              <Select
                id="field-state"
                containerClassName="w-full"
                {...register("state")}
                className={fieldErrorClass(!!errors.state)}
                aria-invalid={!!errors.state}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.state?.message} />
            </div>
            <div>
              <Label htmlFor="field-pincode">Pincode</Label>
              <Input
                id="field-pincode"
                maxLength={6}
                {...register("pincode")}
                className={fieldErrorClass(!!errors.pincode)}
              />
              <FieldError message={errors.pincode?.message} />
            </div>
            <div>
              <Label htmlFor="field-pan_number">PAN</Label>
              <Input
                id="field-pan_number"
                maxLength={10}
                {...register("pan_number")}
                className={fieldErrorClass(!!errors.pan_number)}
              />
              <FieldError message={errors.pan_number?.message} />
            </div>
            <div>
              <Label htmlFor="field-aadhaar_last4">Aadhaar last 4</Label>
              <Input
                id="field-aadhaar_last4"
                maxLength={4}
                {...register("aadhaar_last4")}
                className={fieldErrorClass(!!errors.aadhaar_last4)}
              />
              <FieldError message={errors.aadhaar_last4?.message} />
            </div>
          </FormColumn>
        </FormGrid>
      )}

      {step === 2 && (
        <FormGrid>
          <FormColumn>
            <div>
              <Label htmlFor="field-nominee_name">Nominee name</Label>
              <Input id="field-nominee_name" {...register("nominee_name")} />
            </div>
            <div>
              <Label htmlFor="field-nominee_relation">Nominee relation</Label>
              <Input
                id="field-nominee_relation"
                placeholder="e.g. Spouse, Son"
                {...register("nominee_relation")}
              />
            </div>
          </FormColumn>
          <FormColumn>
            <div>
              <Label htmlFor="field-nominee_dob">Nominee date of birth</Label>
              <Input
                id="field-nominee_dob"
                type="date"
                {...register("nominee_dob")}
              />
            </div>
            <div>
              <Label htmlFor="field-notes">Notes</Label>
              <Textarea id="field-notes" rows={3} {...register("notes")} />
            </div>
          </FormColumn>
        </FormGrid>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <ReviewSummary
            sections={[
              {
                title: "Personal",
                rows: [
                  { label: "Full name", value: values.full_name },
                  { label: "Date of birth", value: values.date_of_birth },
                  {
                    label: "Gender",
                    value: values.gender ? formatLabel(values.gender) : null,
                  },
                  {
                    label: "Marital status",
                    value: values.marital_status
                      ? formatLabel(values.marital_status)
                      : null,
                  },
                  { label: "Occupation", value: values.occupation },
                  {
                    label: "Annual income",
                    value: values.annual_income
                      ? formatINR(Number(values.annual_income))
                      : null,
                  },
                  { label: "Phone", value: values.phone },
                  { label: "Alternate phone", value: values.alternate_phone },
                  { label: "Email", value: values.email },
                ],
              },
              {
                title: "Address & identity",
                rows: [
                  {
                    label: "Address",
                    value:
                      [values.address_line1, values.address_line2]
                        .filter(Boolean)
                        .join(", ") || null,
                  },
                  { label: "City", value: values.city },
                  { label: "State", value: values.state },
                  { label: "Pincode", value: values.pincode },
                  { label: "PAN", value: values.pan_number },
                  { label: "Aadhaar last 4", value: values.aadhaar_last4 },
                ],
              },
              {
                title: "Nominee & notes",
                rows: [
                  { label: "Nominee", value: values.nominee_name },
                  { label: "Relation", value: values.nominee_relation },
                  { label: "Nominee DOB", value: values.nominee_dob },
                  { label: "Notes", value: values.notes },
                ],
              },
            ]}
          />
          {submitError && <Alert variant="error">{submitError}</Alert>}
        </div>
      )}
    </form>
  );
}
