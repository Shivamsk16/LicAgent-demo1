"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { addYears } from "date-fns";
import { ReviewSummary, formatLabel } from "@/components/shared/review-summary";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import {
  policyStep0Schema,
  policyStep1Schema,
} from "@/lib/forms/policy-steps";
import {
  focusFormField,
  fieldErrorClass,
  validateStep,
} from "@/lib/forms/step-validation";
import type { Customer } from "@/types/business";

const POLICY_TYPES = [
  "endowment", "whole_life", "term", "money_back", "ulip", "pension", "child", "group",
];
const FREQUENCIES = ["monthly", "quarterly", "half_yearly", "yearly", "single"];

const INITIAL_FORM = {
  customer_id: "",
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

export function PolicyForm({
  prefillCustomerId,
  embedded = false,
  showCancel = false,
  onSuccess,
  onCancel,
  onDirtyChange,
}: {
  prefillCustomerId?: string | null;
  embedded?: boolean;
  showCancel?: boolean;
  onSuccess?: (policyId: string) => void;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCustomer =
    prefillCustomerId ?? searchParams.get("customer");

  const submittingRef = useRef(false);
  const initialFormRef = useRef(
    JSON.stringify({ ...INITIAL_FORM, customer_id: prefillCustomer ?? "" })
  );

  const [step, setStep] = useState(prefillCustomer ? 1 : 0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersError, setCustomersError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    customer_id: prefillCustomer ?? "",
  });

  useEffect(() => {
    fetch("/api/customers?pageSize=500&sort=full_name&order=asc")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) {
          setCustomersError(j.error?.message ?? "Failed to load customers");
          return;
        }
        setCustomers(j.data?.items ?? []);
      })
      .catch(() => setCustomersError("Failed to load customers"));
  }, []);

  useEffect(() => {
    if (form.commencement_date && form.policy_term_years) {
      const m = addYears(new Date(form.commencement_date), Number(form.policy_term_years))
        .toISOString()
        .slice(0, 10);
      setForm((f) => ({ ...f, maturity_date: m }));
    }
  }, [form.commencement_date, form.policy_term_years]);

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(form) !== initialFormRef.current);
  }, [form, onDirtyChange]);

  const selected = customers.find((c) => c.id === form.customer_id);

  function updateForm(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
    const keys = Object.keys(patch);
    setFieldErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of keys) {
        if (next[key]) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  function advance(nextStep: number, schema: Parameters<typeof validateStep>[0]) {
    const result = validateStep(schema, form);
    if (!result.ok) {
      setFieldErrors(result.errors);
      focusFormField(result.firstField);
      return;
    }
    setFieldErrors({});
    setStep(nextStep);
  }

  async function submit() {
    if (loading || submittingRef.current) return;

    const step1 = validateStep(policyStep1Schema, form);
    if (!step1.ok) {
      setFieldErrors(step1.errors);
      setStep(1);
      focusFormField(step1.firstField);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sum_assured: Number(form.sum_assured),
          premium_amount: Number(form.premium_amount),
          premium_term_years: Number(form.premium_term_years),
          policy_term_years: Number(form.policy_term_years),
          plan_code: form.plan_code || undefined,
          maturity_date: form.maturity_date || undefined,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        submittingRef.current = false;
        setLoading(false);
        setError(json.error?.message ?? "Failed to create policy");
        return;
      }

      if (onSuccess) {
        onSuccess(json.data.id);
      } else {
        router.push(`/dashboard/policies/${json.data.id}`);
        router.refresh();
      }
    } catch {
      submittingRef.current = false;
      setLoading(false);
      setError("Failed to create policy");
    }
  }

  return (
    <div className={embedded ? "space-y-4" : "max-w-2xl space-y-4"}>
      {customersError && step === 0 && (
        <Alert variant="error" title="Could not load customers">
          {customersError}
          <Link href="/dashboard/customers?new=1" className="mt-2 block text-xs font-medium underline">
            Create a new customer instead
          </Link>
        </Alert>
      )}

      {step === 0 && (
        <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/[0.06]">
          <Label htmlFor="field-customer_id">Customer *</Label>
          <Select
            id="field-customer_id"
            containerClassName="w-full mt-1"
            value={form.customer_id}
            onChange={(e) => updateForm({ customer_id: e.target.value })}
            className={fieldErrorClass(!!fieldErrors.customer_id)}
            aria-invalid={!!fieldErrors.customer_id}
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name} · {c.phone}</option>
            ))}
          </Select>
          {fieldErrors.customer_id && (
            <p className="mt-1.5 text-xs text-lic-red-600" role="alert">
              {fieldErrors.customer_id}
            </p>
          )}
          <Link href="/dashboard/customers?new=1" className="mt-2 inline-block text-sm text-lic-blue-400">
            Create new customer
          </Link>
          <div className="mt-4 flex flex-wrap gap-2">
            {showCancel && onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={() => advance(1, policyStep0Schema)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 1 && selected && (
        <div className="rounded-card border bg-lic-neutral-25 p-3 text-sm mb-2">
          {selected.full_name} · {selected.phone} · KYC: {selected.kyc_status}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3 rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/[0.06]">
          <div>
            <Label htmlFor="field-policy_number">Policy number *</Label>
            <Input
              id="field-policy_number"
              value={form.policy_number}
              onChange={(e) => updateForm({ policy_number: e.target.value })}
              className={fieldErrorClass(!!fieldErrors.policy_number)}
            />
            {fieldErrors.policy_number && (
              <p className="mt-1.5 text-xs text-lic-red-600">{fieldErrors.policy_number}</p>
            )}
          </div>
          <div>
            <Label htmlFor="field-plan_name">Plan name *</Label>
            <Input
              id="field-plan_name"
              value={form.plan_name}
              onChange={(e) => updateForm({ plan_name: e.target.value })}
              className={fieldErrorClass(!!fieldErrors.plan_name)}
            />
            {fieldErrors.plan_name && (
              <p className="mt-1.5 text-xs text-lic-red-600">{fieldErrors.plan_name}</p>
            )}
          </div>
          <div>
            <Label>Policy type</Label>
            <Select containerClassName="w-full" value={form.policy_type} onChange={(e) => updateForm({ policy_type: e.target.value })}>
              {POLICY_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="field-sum_assured">Sum assured ₹ *</Label>
              <Input
                id="field-sum_assured"
                type="number"
                value={form.sum_assured}
                onChange={(e) => updateForm({ sum_assured: e.target.value })}
                className={fieldErrorClass(!!fieldErrors.sum_assured)}
              />
              {fieldErrors.sum_assured && (
                <p className="mt-1.5 text-xs text-lic-red-600">{fieldErrors.sum_assured}</p>
              )}
            </div>
            <div>
              <Label htmlFor="field-premium_amount">Premium ₹ *</Label>
              <Input
                id="field-premium_amount"
                type="number"
                value={form.premium_amount}
                onChange={(e) => updateForm({ premium_amount: e.target.value })}
                className={fieldErrorClass(!!fieldErrors.premium_amount)}
              />
              {fieldErrors.premium_amount && (
                <p className="mt-1.5 text-xs text-lic-red-600">{fieldErrors.premium_amount}</p>
              )}
            </div>
          </div>
          <div>
            <Label>Frequency</Label>
            <Select containerClassName="w-full" value={form.premium_frequency} onChange={(e) => updateForm({ premium_frequency: e.target.value })}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{formatLabel(f)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="field-policy_term_years">Term (years) *</Label>
              <Input
                id="field-policy_term_years"
                type="number"
                value={form.policy_term_years}
                onChange={(e) => updateForm({ policy_term_years: e.target.value })}
                className={fieldErrorClass(!!fieldErrors.policy_term_years)}
              />
              {fieldErrors.policy_term_years && (
                <p className="mt-1.5 text-xs text-lic-red-600">{fieldErrors.policy_term_years}</p>
              )}
            </div>
            <div>
              <Label htmlFor="field-commencement_date">Commencement *</Label>
              <Input
                id="field-commencement_date"
                type="date"
                value={form.commencement_date}
                onChange={(e) => updateForm({ commencement_date: e.target.value })}
                className={fieldErrorClass(!!fieldErrors.commencement_date)}
              />
              {fieldErrors.commencement_date && (
                <p className="mt-1.5 text-xs text-lic-red-600">{fieldErrors.commencement_date}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!prefillCustomer && (
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>Back</Button>
            )}
            {showCancel && onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            )}
            <Button type="button" onClick={() => advance(2, policyStep1Schema)}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/[0.06]">
          <p className="text-sm text-lic-neutral-600">
            Estimated maturity date:{" "}
            <span className="font-medium text-lic-neutral-900">
              {form.maturity_date ? formatDateIST(form.maturity_date) : "—"}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
            {showCancel && onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            )}
            <Button type="button" onClick={() => setStep(3)}>Review</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/[0.06] space-y-4">
          <ReviewSummary
            sections={[
              {
                title: "Customer",
                rows: [
                  { label: "Name", value: selected?.full_name },
                  { label: "Phone", value: selected?.phone },
                  { label: "KYC status", value: selected?.kyc_status ? formatLabel(selected.kyc_status) : null },
                ],
              },
              {
                title: "Policy details",
                rows: [
                  { label: "Policy number", value: form.policy_number },
                  { label: "Plan name", value: form.plan_name },
                  { label: "Policy type", value: formatLabel(form.policy_type) },
                  { label: "Sum assured", value: form.sum_assured ? formatINR(Number(form.sum_assured)) : null },
                  { label: "Premium", value: form.premium_amount ? formatINR(Number(form.premium_amount)) : null },
                  { label: "Frequency", value: formatLabel(form.premium_frequency) },
                  { label: "Term", value: form.policy_term_years ? `${form.policy_term_years} years` : null },
                  { label: "Commencement", value: form.commencement_date ? formatDateIST(form.commencement_date) : null },
                  { label: "Maturity", value: form.maturity_date ? formatDateIST(form.maturity_date) : null },
                ],
              },
            ]}
          />
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={loading} onClick={() => setStep(2)}>Back</Button>
            {showCancel && onCancel && (
              <Button type="button" variant="secondary" disabled={loading} onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="button" disabled={loading} onClick={submit}>
              {loading ? "Saving…" : "Confirm & create"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
