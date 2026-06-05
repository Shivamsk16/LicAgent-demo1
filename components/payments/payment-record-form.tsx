"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer, Policy } from "@/types/business";

export function PaymentRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillPolicy = searchParams.get("policy");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    policy_id: prefillPolicy ?? "",
    installment_number: 1,
    due_date: "",
    payment_date: new Date().toISOString().slice(0, 10),
    amount_due: 0,
    amount_paid: 0,
    late_fee: 0,
    payment_mode: "cash",
    receipt_number: "",
    remarks: "",
  });

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((j) => setCustomers(j.data ?? []));
  }, []);

  useEffect(() => {
    if (!form.customer_id) return;
    fetch(`/api/policies?customer_id=${form.customer_id}`)
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data ?? []).filter((p: Policy) =>
          ["in_force", "grace_period"].includes(p.status)
        );
        setPolicies(list);
      });
  }, [form.customer_id]);

  useEffect(() => {
    if (!form.policy_id) return;
    fetch(`/api/payments/suggest?policy_id=${form.policy_id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setForm((f) => ({
            ...f,
            installment_number: j.data.installment_number,
            due_date: j.data.due_date,
            amount_due: Number(j.data.amount_due),
            amount_paid: Number(j.data.amount_due),
            late_fee: Number(j.data.late_fee),
          }));
        }
      });
  }, [form.policy_id]);

  useEffect(() => {
    if (prefillPolicy) {
      fetch(`/api/policies/${prefillPolicy}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.data) setForm((f) => ({ ...f, customer_id: j.data.customer_id, policy_id: prefillPolicy }));
        });
    }
  }, [prefillPolicy]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policy_id: form.policy_id,
        payment_date: form.payment_date,
        due_date: form.due_date,
        amount_due: form.amount_due,
        amount_paid: form.amount_paid,
        installment_number: form.installment_number,
        payment_mode: form.payment_mode,
        receipt_number: form.receipt_number || undefined,
        late_fee: form.late_fee,
        remarks: form.remarks || undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) router.push(`/dashboard/payments/${json.data.id}`);
    else alert(json.error?.message);
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4 rounded-card border bg-white p-5 shadow-card">
      <div>
        <Label>Customer</Label>
        <select
          className="h-9 w-full rounded-btn border px-2 text-sm"
          value={form.customer_id}
          onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value, policy_id: "" }))}
          required
        >
          <option value="">Select</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Policy</Label>
        <select
          className="h-9 w-full rounded-btn border px-2 text-sm"
          value={form.policy_id}
          onChange={(e) => setForm((f) => ({ ...f, policy_id: e.target.value }))}
          required
        >
          <option value="">Select</option>
          {policies.map((p) => (
            <option key={p.id} value={p.id}>{p.policy_number} — {p.plan_name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Installment #</Label><Input type="number" value={form.installment_number} readOnly /></div>
        <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} required /></div>
        <div><Label>Payment date</Label><Input type="date" value={form.payment_date} onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))} required /></div>
        <div><Label>Amount due</Label><Input type="number" value={form.amount_due} readOnly /></div>
        <div><Label>Amount paid *</Label><Input type="number" value={form.amount_paid} onChange={(e) => setForm((f) => ({ ...f, amount_paid: Number(e.target.value) }))} required /></div>
        <div><Label>Late fee</Label><Input type="number" value={form.late_fee} onChange={(e) => setForm((f) => ({ ...f, late_fee: Number(e.target.value) }))} /></div>
      </div>
      <div>
        <Label>Payment mode</Label>
        <select className="h-9 w-full rounded-btn border px-2 text-sm" value={form.payment_mode} onChange={(e) => setForm((f) => ({ ...f, payment_mode: e.target.value }))}>
          {["cash", "cheque", "neft", "upi", "online", "dd"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div><Label>Receipt #</Label><Input value={form.receipt_number} onChange={(e) => setForm((f) => ({ ...f, receipt_number: e.target.value }))} /></div>
      <Button type="submit" disabled={loading}>{loading ? "Recording…" : "Record payment"}</Button>
    </form>
  );
}
