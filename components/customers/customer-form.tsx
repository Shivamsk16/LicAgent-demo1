"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDIAN_STATES } from "@/lib/constants/states";
import type { Customer } from "@/types/business";

const steps = ["Personal", "Address & identity", "Review"];

export function CustomerForm({
  initial,
  customerId,
}: {
  initial?: Partial<Customer>;
  customerId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
  }

  async function save(andPolicy: boolean) {
    setLoading(true);
    setError("");
    const body = {
      ...form,
      annual_income: form.annual_income ? Number(form.annual_income) : undefined,
      gender: form.gender || undefined,
      marital_status: form.marital_status || undefined,
    };
    const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
    const method = customerId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      setError(json.error?.message ?? "Save failed");
      return;
    }
    if (andPolicy) {
      router.push(`/dashboard/policies/new?customer=${json.data.id}`);
    } else {
      router.push(`/dashboard/customers/${json.data.id}`);
    }
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex gap-2">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`rounded-badge px-3 py-1 text-xs font-medium ${
              i === step ? "bg-lic-yellow-400" : "bg-lic-neutral-200"
            }`}
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3 rounded-card border bg-white p-5 shadow-card">
          <div>
            <Label>Full name *</Label>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Date of birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            </div>
            <div>
              <Label>Gender</Label>
              <select
                className="h-9 w-full rounded-btn border px-2 text-sm"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Phone *</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <Button onClick={() => setStep(1)}>Next</Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3 rounded-card border bg-white p-5 shadow-card">
          <div>
            <Label>City *</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </div>
          <div>
            <Label>State *</Label>
            <select
              className="h-9 w-full rounded-btn border px-2 text-sm"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              required
            >
              <option value="">Select</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>PAN</Label>
            <Input value={form.pan_number} onChange={(e) => set("pan_number", e.target.value.toUpperCase())} />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 rounded-card border bg-white p-5 shadow-card">
          <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(form, null, 2)}</pre>
          {error && <p className="text-sm text-lic-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button disabled={loading} onClick={() => save(false)}>
              {loading ? "Saving…" : "Save only"}
            </Button>
            <Button variant="secondary" disabled={loading} onClick={() => save(true)}>
              Save & add policy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
