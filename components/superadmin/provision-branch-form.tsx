"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/constants/states";

export function ProvisionBranchForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const plan = fd.get("plan") as string;
    const body = {
      name: fd.get("name"),
      branch_code: fd.get("branch_code"),
      city: fd.get("city"),
      state: fd.get("state"),
      address: fd.get("address") || undefined,
      phone: fd.get("phone") || undefined,
      email: fd.get("email") || undefined,
      plan,
      max_agents: Number(fd.get("max_agents") ?? 50),
      billing_cycle:
        plan === "trial" ? "monthly" : (fd.get("billing_cycle") as string),
      manager_name: fd.get("manager_name"),
      manager_email: fd.get("manager_email"),
      manager_phone: fd.get("manager_phone"),
      manager_employee_id: fd.get("manager_employee_id") || undefined,
    };

    const res = await fetch("/api/superadmin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.success) {
      setError(json.error?.message ?? "Failed to provision branch");
      return;
    }

    onSuccess?.();
    router.push(`/superadmin/tenants/${json.data.tenant.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-lic-neutral-900">
          Branch details
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Branch name *</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="branch_code">Branch code *</Label>
            <Input id="branch_code" name="branch_code" required />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input id="city" name="city" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="state">State *</Label>
            <Select id="state" name="state" containerClassName="w-full" required>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              name="address"
              rows={2}
              className="w-full rounded-btn border border-lic-neutral-200 bg-lic-neutral-0 px-3 py-2 text-sm text-lic-neutral-800 shadow-xs transition-[border-color,box-shadow] duration-150 ease-out hover:border-lic-neutral-300 focus:border-lic-blue-400 focus:outline-none focus:ring-[3px] focus:ring-lic-blue-400/15"
            />
          </div>
          <div>
            <Label htmlFor="phone">Branch phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div>
            <Label htmlFor="email">Branch email</Label>
            <Input id="email" name="email" type="email" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-lic-neutral-900">
          Subscription
        </h3>
        <div className="flex flex-wrap gap-4">
          {(["trial", "starter", "pro"] as const).map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm capitalize">
              <input type="radio" name="plan" value={p} defaultChecked={p === "trial"} />
              {p}
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="max_agents">Max agents</Label>
            <Input id="max_agents" name="max_agents" type="number" defaultValue={50} />
          </div>
          <div>
            <Label htmlFor="billing_cycle">Billing cycle</Label>
            <Select id="billing_cycle" name="billing_cycle" containerClassName="w-full">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-lic-neutral-900">
          Branch manager
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="manager_name">Full name *</Label>
            <Input id="manager_name" name="manager_name" required />
          </div>
          <div>
            <Label htmlFor="manager_email">Email *</Label>
            <Input id="manager_email" name="manager_email" type="email" required />
          </div>
          <div>
            <Label htmlFor="manager_phone">Phone *</Label>
            <Input id="manager_phone" name="manager_phone" required pattern="[6-9][0-9]{9}" />
          </div>
          <div>
            <Label htmlFor="manager_employee_id">Employee ID</Label>
            <Input id="manager_employee_id" name="manager_employee_id" />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-lic-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Provisioning…" : "Provision branch"}
      </Button>
    </form>
  );
}
