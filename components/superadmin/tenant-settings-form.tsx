"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDIAN_STATES } from "@/lib/constants/states";
import type { Tenant } from "@/types/database";

export function TenantSettingsForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [confirmName, setConfirmName] = useState("");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/superadmin/tenants/${tenant.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        branch_code: fd.get("branch_code"),
        city: fd.get("city"),
        state: fd.get("state"),
        address: fd.get("address"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        plan: fd.get("plan"),
        max_agents: Number(fd.get("max_agents")),
      }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error?.message ?? "Save failed");
      return;
    }
    router.refresh();
  }

  async function setStatus(status: string, reason?: string) {
    await fetch(`/api/superadmin/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    router.refresh();
  }

  async function deleteBranch() {
    if (confirmName !== tenant.name) {
      setError("Branch name does not match");
      return;
    }
    await setStatus("cancelled", "Deleted by SuperAdmin");
    router.push("/superadmin/tenants");
  }

  return (
    <div className="max-w-xl space-y-8">
      <form onSubmit={save} className="space-y-4 rounded-card border bg-white p-5 shadow-card">
        <h3 className="font-semibold">Branch settings</h3>
        <div>
          <Label htmlFor="name">Branch name</Label>
          <Input id="name" name="name" defaultValue={tenant.name} required />
        </div>
        <div>
          <Label htmlFor="branch_code">Branch code</Label>
          <Input id="branch_code" name="branch_code" defaultValue={tenant.branch_code ?? ""} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={tenant.city ?? ""} />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <select
              id="state"
              name="state"
              defaultValue={tenant.state ?? ""}
              className="h-9 w-full rounded-btn border border-lic-neutral-200 px-2 text-sm"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <textarea
            id="address"
            name="address"
            defaultValue={tenant.address ?? ""}
            className="w-full rounded-btn border border-lic-neutral-200 px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="plan">Plan</Label>
          <select
            id="plan"
            name="plan"
            defaultValue={tenant.plan}
            className="h-9 w-full rounded-btn border px-2 text-sm"
          >
            <option value="trial">Trial</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div>
          <Label htmlFor="max_agents">Max agents</Label>
          <Input
            id="max_agents"
            name="max_agents"
            type="number"
            defaultValue={tenant.max_agents}
          />
        </div>
        {error && <p className="text-sm text-lic-red-600">{error}</p>}
        <Button type="submit">Save changes</Button>
      </form>

      <div className="space-y-2 rounded-card border bg-white p-5 shadow-card">
        <h3 className="font-semibold">Status</h3>
        {tenant.status === "active" ? (
          <Button variant="danger" onClick={() => setStatus("suspended", "Admin suspended")}>
            Suspend branch
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setStatus("active")}>
            Reactivate branch
          </Button>
        )}
      </div>

      <div className="rounded-card border border-lic-red-600/30 bg-lic-red-100/20 p-5">
        <h3 className="font-semibold text-lic-red-600">Danger zone</h3>
        <p className="mt-1 text-sm text-lic-neutral-500">
          Type <strong>{tenant.name}</strong> to confirm cancellation.
        </p>
        <Input
          className="mt-3"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder="Branch name"
        />
        <Button variant="danger" className="mt-3" onClick={deleteBranch}>
          Delete branch
        </Button>
      </div>
    </div>
  );
}
