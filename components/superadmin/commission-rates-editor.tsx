"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              {["Policy type", "Commission type", "Rate %", "Effective from", "Effective to", "Actions"].map(
                (h) => (
                  <TableHead key={h}>{h}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((r) => (
              <TableRow key={r.id} interactive>
                <TableCell className="capitalize">{r.policy_type.replace("_", " ")}</TableCell>
                <TableCell>{r.commission_type.replace("_", " ")}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>{r.effective_from}</TableCell>
                <TableCell>{r.effective_to ?? "—"}</TableCell>
                <TableCell className="text-lic-neutral-500">
                  {saving === r.id ? "Saving…" : "Edit on blur"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <form onSubmit={addRate} className="rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06]">
        <h3 className="mb-3 text-sm font-semibold">Add rate</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <Input name="policy_type" placeholder="Policy type" required />
          <Select name="commission_type" containerClassName="w-full" required>
            <option value="first_year">First year</option>
            <option value="renewal">Renewal</option>
            <option value="bonus">Bonus</option>
          </Select>
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
