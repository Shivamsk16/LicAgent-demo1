"use client";

import { useState, useEffect } from "react";
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
import type { Customer } from "@/types/business";

const POLICY_TYPES = [
  "endowment", "whole_life", "term", "money_back", "ulip", "pension", "child", "group",
];
const FREQUENCIES = ["monthly", "quarterly", "half_yearly", "yearly", "single"];

export function PolicyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCustomer = searchParams.get("customer");

  const [step, setStep] = useState(prefillCustomer ? 1 : 0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersError, setCustomersError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_id: prefillCustomer ?? "",
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

  const selected = customers.find((c) => c.id === form.customer_id);

  async function submit() {
    setLoading(true);
    setError("");
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
    setLoading(false);
    if (json.success) {
      router.push(`/dashboard/policies/${json.data.id}`);
    } else {
      setError(json.error?.message ?? "Failed to create policy");
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {customersError && step === 0 && (
        <Alert variant="error" title="Could not load customers">
          {customersError}
          <Link href="/dashboard/customers/new" className="mt-2 block text-xs font-medium underline">
            Create a new customer instead
          </Link>
        </Alert>
      )}

      {step === 0 && (
        <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/\[0\.06\]">
          <Label>Customer *</Label>
          <Select
            containerClassName="w-full mt-1"
            value={form.customer_id}
            onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name} · {c.phone}</option>
            ))}
          </Select>
          <Link href="/dashboard/customers/new" className="mt-2 inline-block text-sm text-lic-blue-400">
            Create new customer
          </Link>
          <Button className="mt-4" disabled={!form.customer_id} onClick={() => setStep(1)}>Next</Button>
        </div>
      )}
      {step === 1 && selected && (
        <div className="rounded-card border bg-lic-neutral-25 p-3 text-sm mb-2">
          {selected.full_name} · {selected.phone} · KYC: {selected.kyc_status}
        </div>
      )}
      {step === 1 && (
        <div className="space-y-3 rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/\[0\.06\]">
          <div><Label>Policy number *</Label><Input value={form.policy_number} onChange={(e) => setForm((f) => ({ ...f, policy_number: e.target.value }))} /></div>
          <div><Label>Plan name *</Label><Input value={form.plan_name} onChange={(e) => setForm((f) => ({ ...f, plan_name: e.target.value }))} /></div>
          <div>
            <Label>Policy type</Label>
            <Select containerClassName="w-full" value={form.policy_type} onChange={(e) => setForm((f) => ({ ...f, policy_type: e.target.value }))}>
              {POLICY_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sum assured ₹</Label><Input type="number" value={form.sum_assured} onChange={(e) => setForm((f) => ({ ...f, sum_assured: e.target.value }))} /></div>
            <div><Label>Premium ₹</Label><Input type="number" value={form.premium_amount} onChange={(e) => setForm((f) => ({ ...f, premium_amount: e.target.value }))} /></div>
          </div>
          <div>
            <Label>Frequency</Label>
            <Select containerClassName="w-full" value={form.premium_frequency} onChange={(e) => setForm((f) => ({ ...f, premium_frequency: e.target.value }))}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{formatLabel(f)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Term (years)</Label><Input type="number" value={form.policy_term_years} onChange={(e) => setForm((f) => ({ ...f, policy_term_years: e.target.value }))} /></div>
            <div><Label>Commencement</Label><Input type="date" value={form.commencement_date} onChange={(e) => setForm((f) => ({ ...f, commencement_date: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            {!prefillCustomer && <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>}
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/\[0\.06\]">
          <p className="text-sm text-lic-neutral-600">
            Estimated maturity date:{" "}
            <span className="font-medium text-lic-neutral-900">
              {form.maturity_date ? formatDateIST(form.maturity_date) : "—"}
            </span>
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Review</Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/\[0\.06\] space-y-4">
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
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button disabled={loading} onClick={submit}>
              {loading ? "Saving…" : "Confirm & create"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
