"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { FileText } from "lucide-react";
import type { Policy } from "@/types/business";

export function PoliciesList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies", search, status],
    queryFn: async () => {
      const qs = new URLSearchParams({
        ...(search && { search }),
        ...(status !== "all" && { status }),
      });
      const res = await fetch(`/api/policies?${qs}`);
      const json = await res.json();
      return json.data as Policy[];
    },
  });

  return (
    <>
      <PageHeader
        title="Policies"
        actions={
          <Link href="/dashboard/policies/new">
            <Button>Add policy</Button>
          </Link>
        }
      />
      <div className="mb-4 flex gap-3">
        <Input placeholder="Policy # or plan…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-btn border px-2 text-sm">
          <option value="all">All statuses</option>
          <option value="in_force">In force</option>
          <option value="lapsed">Lapsed</option>
          <option value="grace_period">Grace</option>
        </select>
      </div>
      {isLoading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : policies.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No policies found"
          description="Create a policy for an existing customer."
          actionLabel="Add policy"
          actionHref="/dashboard/policies/new"
        />
      ) : (
        <div className="overflow-x-auto rounded-card border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-lic-blue-50">
                {["Policy #", "Customer", "Plan", "Premium", "Next due", "Status", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs uppercase text-lic-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-3 py-2 font-medium">{p.policy_number}</td>
                  <td className="px-3 py-2">{p.customer?.full_name}</td>
                  <td className="px-3 py-2">{p.plan_name}</td>
                  <td className="px-3 py-2">{formatINR(Number(p.premium_amount))}</td>
                  <td className="px-3 py-2">{p.next_premium_due ? formatDateIST(p.next_premium_due) : "—"}</td>
                  <td className="px-3 py-2"><Badge>{p.status}</Badge></td>
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/policies/${p.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
