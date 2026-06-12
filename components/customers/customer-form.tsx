"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  Form,
  FormSection,
  FormField,
  FormRow,
  FormActions,
} from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";
import { INDIAN_STATES } from "@/lib/constants/states";
import { ReviewSummary, formatLabel } from "@/components/shared/review-summary";
import { formatINR } from "@/lib/utils/currency";
import { customerSchema } from "@/lib/utils/validators";
import { digitsOnly } from "@/lib/validation/customer";
import {
  customerPayloadForValidation,
  customerStep0Schema,
  customerStep1Schema,
  customerStep2Schema,
} from "@/lib/forms/customer-steps";
import {
  focusFormField,
  fieldErrorClass,
  validateStep,
} from "@/lib/forms/step-validation";
import type { Customer } from "@/types/business";

const steps = ["Personal", "Address & identity", "Nominee & notes", "Review"];

export function CustomerForm({
  initial,
  customerId,
}: {
  initial?: Partial<Customer>;
  customerId?: string;
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    date_of_birth: initial?.date_of_birth ?? "",
    gender: initial?.gender ?? "",
    marital_status: initial?.marital_status ?? "",
    occupation: initial?.occupation ?? "",
    annual_income: initial?.annual_income?.toString() ?? "",
    phone: initial?.phone ?? "",
    alternate_phone: initial?.alternate_phone ?? "",
    email: initial?.email ?? "",
    address_line1: initial?.address_line1 ?? "",
    address_line2: initial?.address_line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
    pan_number: initial?.pan_number ?? "",
    aadhaar_last4: initial?.aadhaar_last4 ?? "",
    nominee_name: initial?.nominee_name ?? "",
    nominee_relation: initial?.nominee_relation ?? "",
    nominee_dob: initial?.nominee_dob ?? "",
    notes: initial?.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function setPhoneField(field: "phone" | "alternate_phone", value: string) {
    set(field, digitsOnly(value));
  }

  function validateField(field: keyof typeof form) {
    const payload = customerPayloadForValidation(form);
    const parsed = customerSchema.safeParse(payload);
    if (parsed.success) {
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return;
    }
    const issue = parsed.error.issues.find((i) => i.path[0] === field);
    if (issue) {
      setFieldErrors((prev) => ({ ...prev, [field]: issue.message }));
    }
  }

  function advance(
    nextStep: number,
    schema: Parameters<typeof validateStep>[0]
  ) {
    const result = validateStep(schema, customerPayloadForValidation(form));
    if (!result.ok) {
      setFieldErrors(result.errors);
      focusFormField(result.firstField);
      return;
    }
    setFieldErrors({});
    setStep(nextStep);
  }

  async function save(andPolicy: boolean) {
    if (loading || submittingRef.current) return;

    const payload = customerPayloadForValidation(form);
    const parsed = customerSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fix validation errors");
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError("");

    const body = {
      ...form,
      annual_income: form.annual_income ? Number(form.annual_income) : undefined,
      gender: form.gender || undefined,
      marital_status: form.marital_status || undefined,
    };

    try {
      const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
      const method = customerId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!json.success) {
        submittingRef.current = false;
        setLoading(false);
        setError(json.error?.message ?? "Save failed");
        return;
      }

      if (andPolicy) {
        router.push(`/dashboard/policies/new?customer=${json.data.id}`);
      } else {
        router.push(`/dashboard/customers/${json.data.id}`);
      }
      router.refresh();
    } catch {
      submittingRef.current = false;
      setLoading(false);
      setError("Save failed");
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i === step
                  ? "bg-lic-neutral-900 text-white"
                  : i < step
                    ? "bg-lic-green-100 text-lic-green-700"
                    : "bg-lic-neutral-100 text-lic-neutral-500"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                i === step
                  ? "font-medium text-lic-neutral-900"
                  : "text-lic-neutral-500"
              )}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 hidden h-px w-8 bg-lic-neutral-200 sm:block" />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card padding="lg">
          <Form>
            <FormSection
              title="Personal details"
              description="Contact and profile information for the customer."
            >
              <FormField label="Full name" required error={fieldErrors.full_name}>
                <Input
                  id="field-full_name"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  className={fieldErrorClass(!!fieldErrors.full_name)}
                  aria-invalid={!!fieldErrors.full_name}
                />
              </FormField>
              <FormRow>
                <FormField label="Date of birth">
                  <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
                </FormField>
                <FormField label="Gender">
                  <Select value={form.gender} onChange={(e) => set("gender", e.target.value)} containerClassName="w-full">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="Marital status">
                  <Select value={form.marital_status} onChange={(e) => set("marital_status", e.target.value)} containerClassName="w-full">
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced</option>
                  </Select>
                </FormField>
                <FormField label="Occupation">
                  <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
                </FormField>
              </FormRow>
              <FormField label="Annual income (₹)" hint="Optional">
                <Input type="number" value={form.annual_income} onChange={(e) => set("annual_income", e.target.value)} />
              </FormField>
              <FormRow>
                <FormField label="Phone" required hint="10-digit mobile" error={fieldErrors.phone}>
                  <Input
                    id="field-phone"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setPhoneField("phone", e.target.value)}
                    onBlur={() => validateField("phone")}
                    className={fieldErrorClass(!!fieldErrors.phone)}
                    aria-invalid={!!fieldErrors.phone}
                  />
                </FormField>
                <FormField label="Alternate phone" hint="Optional" error={fieldErrors.alternate_phone}>
                  <Input
                    id="field-alternate_phone"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.alternate_phone}
                    onChange={(e) => setPhoneField("alternate_phone", e.target.value)}
                    onBlur={() => validateField("alternate_phone")}
                    className={fieldErrorClass(!!fieldErrors.alternate_phone)}
                    aria-invalid={!!fieldErrors.alternate_phone}
                  />
                </FormField>
              </FormRow>
              <FormField label="Email" hint="Optional" error={fieldErrors.email}>
                <Input
                  id="field-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => validateField("email")}
                  className={fieldErrorClass(!!fieldErrors.email)}
                  aria-invalid={!!fieldErrors.email}
                />
              </FormField>
            </FormSection>
            <FormActions>
              <Button type="button" onClick={() => advance(1, customerStep0Schema)}>
                Continue
              </Button>
            </FormActions>
          </Form>
        </Card>
      )}

      {step === 1 && (
        <Card padding="lg">
          <Form>
            <FormSection
              title="Address & identity"
              description="Residential address and identification for KYC."
            >
              <FormField label="Address line 1">
                <Input value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} />
              </FormField>
              <FormField label="Address line 2" hint="Optional">
                <Input value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} />
              </FormField>
              <FormRow>
                <FormField label="City" required error={fieldErrors.city}>
                  <Input
                    id="field-city"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={fieldErrorClass(!!fieldErrors.city)}
                    aria-invalid={!!fieldErrors.city}
                  />
                </FormField>
                <FormField label="Pincode" hint="6 digits" error={fieldErrors.pincode}>
                  <Input
                    id="field-pincode"
                    value={form.pincode}
                    onChange={(e) => set("pincode", e.target.value)}
                    maxLength={6}
                    className={fieldErrorClass(!!fieldErrors.pincode)}
                  />
                </FormField>
              </FormRow>
              <FormField label="State" required error={fieldErrors.state}>
                <Select
                  id="field-state"
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  containerClassName="w-full"
                  className={fieldErrorClass(!!fieldErrors.state)}
                  aria-invalid={!!fieldErrors.state}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
              <FormRow>
                <FormField label="PAN" hint="10-character PAN" error={fieldErrors.pan_number}>
                  <Input
                    id="field-pan_number"
                    value={form.pan_number}
                    onChange={(e) => set("pan_number", e.target.value.toUpperCase())}
                    maxLength={10}
                    className={fieldErrorClass(!!fieldErrors.pan_number)}
                  />
                </FormField>
                <FormField label="Aadhaar last 4" hint="Last 4 digits only" error={fieldErrors.aadhaar_last4}>
                  <Input
                    id="field-aadhaar_last4"
                    value={form.aadhaar_last4}
                    onChange={(e) => set("aadhaar_last4", e.target.value)}
                    maxLength={4}
                    className={fieldErrorClass(!!fieldErrors.aadhaar_last4)}
                  />
                </FormField>
              </FormRow>
            </FormSection>
            <FormActions>
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>Back</Button>
              <Button type="button" onClick={() => advance(2, customerStep1Schema)}>
                Continue
              </Button>
            </FormActions>
          </Form>
        </Card>
      )}

      {step === 2 && (
        <Card padding="lg">
          <Form>
            <FormSection
              title="Nominee & notes"
              description="Policy nominee details and internal notes."
            >
              <FormField label="Nominee name">
                <Input value={form.nominee_name} onChange={(e) => set("nominee_name", e.target.value)} />
              </FormField>
              <FormRow>
                <FormField label="Nominee relation">
                  <Input value={form.nominee_relation} onChange={(e) => set("nominee_relation", e.target.value)} placeholder="e.g. Spouse, Son" />
                </FormField>
                <FormField label="Nominee date of birth">
                  <Input type="date" value={form.nominee_dob} onChange={(e) => set("nominee_dob", e.target.value)} />
                </FormField>
              </FormRow>
              <FormField label="Notes" hint="Internal notes visible to your branch">
                <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
              </FormField>
            </FormSection>
            <FormActions>
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" onClick={() => advance(3, customerStep2Schema)}>
                Continue
              </Button>
            </FormActions>
          </Form>
        </Card>
      )}

      {step === 3 && (
        <Card padding="lg">
          <Form>
            <FormSection title="Review" description="Confirm all details before saving.">
              <ReviewSummary
                sections={[
                  {
                    title: "Personal",
                    rows: [
                      { label: "Full name", value: form.full_name },
                      { label: "Date of birth", value: form.date_of_birth },
                      { label: "Gender", value: form.gender ? formatLabel(form.gender) : null },
                      { label: "Marital status", value: form.marital_status ? formatLabel(form.marital_status) : null },
                      { label: "Occupation", value: form.occupation },
                      { label: "Annual income", value: form.annual_income ? formatINR(Number(form.annual_income)) : null },
                      { label: "Phone", value: form.phone },
                      { label: "Alternate phone", value: form.alternate_phone },
                      { label: "Email", value: form.email },
                    ],
                  },
                  {
                    title: "Address & identity",
                    rows: [
                      { label: "Address", value: [form.address_line1, form.address_line2].filter(Boolean).join(", ") || null },
                      { label: "City", value: form.city },
                      { label: "State", value: form.state },
                      { label: "Pincode", value: form.pincode },
                      { label: "PAN", value: form.pan_number },
                      { label: "Aadhaar last 4", value: form.aadhaar_last4 },
                    ],
                  },
                  {
                    title: "Nominee & notes",
                    rows: [
                      { label: "Nominee", value: form.nominee_name },
                      { label: "Relation", value: form.nominee_relation },
                      { label: "Nominee DOB", value: form.nominee_dob },
                      { label: "Notes", value: form.notes },
                    ],
                  },
                ]}
              />
            </FormSection>
            {error && <Alert variant="error">{error}</Alert>}
            <FormActions>
              <Button type="button" variant="secondary" disabled={loading} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" disabled={loading} onClick={() => save(false)}>
                {loading ? "Saving…" : "Save customer"}
              </Button>
              {!customerId && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => save(true)}
                >
                  {loading ? "Saving…" : "Save and add policy"}
                </Button>
              )}
            </FormActions>
          </Form>
        </Card>
      )}
    </div>
  );
}
