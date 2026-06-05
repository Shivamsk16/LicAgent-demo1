"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CommissionRate } from "@/types/database";

export function CommissionRatesEditor({
  initialRates,
}: {
  initialRates: CommissionRate[];
}) {
  const [rates, setRates] = useState(initialRates);
  const [saving, setSaving] = useState<string | null>(null);

  async function updateRate(id: string, rate_percentage: number) {
    setSaving(id);
    const res = await fetch(`/api/superadmin/commission-rates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate_percentage }),
    });
    setSaving(null);
    if (res.ok) {
      const json = await res.json();
      setRates((prev) =>
        prev.map((r) => (r.id === id ? json.data : r))
      );
    }
  }

  async function addRate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/superadmin/commission-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policy_type: fd.get("policy_type"),
        commission_type: fd.get("commission_type"),
        rate_percentage: Number(fd.get("rate_percentage")),
        effective_from: fd.get("effective_from"),
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setRates((prev) => [...prev, json.data]);
      e.currentTarget.reset();
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-card border border-lic-neutral-200 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-lic-neutral-200 bg-lic-blue-50">
              {["Policy type", "Commission type", "Rate %", "Effective from", "Effective to", "Actions"].map(
                (h) => (
                  <th key={h} className="px-3 py-2 text-xs font-semibold uppercase text-lic-neutral-500">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.id} className="border-b border-lic-neutral-200">
                <td className="px-3 py-2 capitalize">{r.policy_type.replace("_", " ")}</td>
                <td className="px-3 py-2">{r.commission_type.replace("_", " ")}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={r.rate_percentage}
                    className="w-24"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== r.rate_percentage) updateRate(r.id, v);
                    }}
                  />
                </td>
                <td className="px-3 py-2">{r.effective_from}</td>
                <td className="px-3 py-2">{r.effective_to ?? "—"}</td>
                <td className="px-3 py-2">
                  {saving === r.id ? "Saving…" : "Edit on blur"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addRate} className="rounded-card border border-lic-neutral-200 bg-white p-4 shadow-card">
        <h3 className="mb-3 text-sm font-semibold">Add rate</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input name="policy_type" placeholder="Policy type" required />
          <select name="commission_type" className="h-9 rounded-btn border border-lic-neutral-200 px-2 text-sm" required>
            <option value="first_year">First year</option>
            <option value="renewal">Renewal</option>
            <option value="bonus">Bonus</option>
          </select>
          <Input name="rate_percentage" type="number" placeholder="Rate %" required />
          <Input name="effective_from" type="date" required defaultValue="2024-04-01" />
        </div>
        <Button type="submit" className="mt-3" size="sm">
          Add rate
        </Button>
      </form>
    </div>
  );
}
