"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TenantsTable } from "@/components/superadmin/tenants-table";
import { INDIAN_STATES } from "@/lib/constants/states";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Search } from "lucide-react";
import type { TenantWithStats } from "@/types/database";

export function TenantsListClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [state, setState] = useState("all");
  const qc = useQueryClient();

  const queryString = new URLSearchParams({
    ...(search && { search }),
    ...(status !== "all" && { status }),
    ...(plan !== "all" && { plan }),
    ...(state !== "all" && { state }),
  }).toString();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/superadmin/tenants?${queryString}`);
      const json = await res.json();
      return (json.success ? json.data : []) as TenantWithStats[];
    },
  });

  const onSuspend = useCallback(
    async (id: string, newStatus: string) => {
      await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      qc.invalidateQueries({ queryKey: ["tenants"] });
    },
    [qc]
  );

  return (
    <div className="section-gap">
      <PageHeader
        title="All branches"
        description="Manage LIC branch tenants"
        actions={
          <Link href="/superadmin/tenants/new">
            <Button>Add new branch</Button>
          </Link>
        }
      />

      <div className="filter-bar mb-6">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lic-neutral-400" strokeWidth={1.75} />
          <Input
            placeholder="Search name, code, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          containerClassName="w-[160px]"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </Select>
        <Select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          containerClassName="w-[140px]"
        >
          <option value="all">All plans</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
        </Select>
        <Select
          value={state}
          onChange={(e) => setState(e.target.value)}
          containerClassName="max-w-[200px]"
        >
          <option value="all">All states</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No branches found"
          description="Provision a new LIC branch to get started."
          actionLabel="Add branch"
          actionHref="/superadmin/tenants/new"
        />
      ) : (
        <TenantsTable tenants={tenants} onSuspend={onSuspend} />
      )}
    </div>
  );
}
