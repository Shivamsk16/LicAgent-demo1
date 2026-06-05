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
import { Users } from "lucide-react";
import type { Customer } from "@/types/business";

const kycVariant: Record<string, "pending" | "active" | "trial" | "suspended" | "starter"> = {
  pending: "pending",
  documents_uploaded: "starter",
  verified: "active",
  rejected: "suspended",
};

export function CustomersList() {
  const [search, setSearch] = useState("");
  const [kyc, setKyc] = useState("all");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search, kyc],
    queryFn: async () => {
      const qs = new URLSearchParams({ ...(search && { search }), ...(kyc !== "all" && { kyc_status: kyc }) });
      const res = await fetch(`/api/customers?${qs}`);
      const json = await res.json();
      return (json.success ? json.data : []) as Customer[];
    },
  });

  return (
    <>
      <PageHeader
        title="Customers"
        actions={
          <Link href="/dashboard/customers/new">
            <Button>Add customer</Button>
          </Link>
        }
      />
      <div className="mb-4 flex gap-3">
        <Input
          placeholder="Search name, phone, PAN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={kyc}
          onChange={(e) => setKyc(e.target.value)}
          className="h-9 rounded-btn border px-2 text-sm"
        >
          <option value="all">All KYC</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
        </select>
      </div>
      {isLoading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to get started."
          actionLabel="Add customer"
          actionHref="/dashboard/customers/new"
        />
      ) : (
        <div className="overflow-x-auto rounded-card border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-lic-blue-50">
                {["Code", "Name", "Phone", "City", "KYC", "Agent", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase text-lic-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-lic-neutral-50">
                  <td className="px-3 py-2">{c.customer_code ?? "—"}</td>
                  <td className="px-3 py-2 font-medium">{c.full_name}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.city ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant={kycVariant[c.kyc_status] ?? "pending"}>{c.kyc_status}</Badge>
                  </td>
                  <td className="px-3 py-2">{c.agent?.full_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/customers/${c.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
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
