"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateIST } from "@/lib/utils/dates";
import { formatINR } from "@/lib/utils/currency";
import type { Customer, Policy, Payment } from "@/types/business";
import { KycDocuments } from "@/components/customers/kyc-documents";
import { DetailSkeleton } from "@/components/ui/skeleton";

const tabs = ["Personal", "KYC", "Policies", "Payments"] as const;

export function CustomerDetail({ customerId }: { customerId: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Personal");

  const { data: customer } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}`);
      const json = await res.json();
      return json.data as Customer;
    },
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/policies?customer_id=${customerId}`);
      const json = await res.json();
      return json.data as Policy[];
    },
    enabled: tab === "Policies" || tab === "Payments",
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["payments-customer"],
    queryFn: async () => {
      const res = await fetch("/api/payments");
      const json = await res.json();
      const all = (json.data?.payments ?? json.data ?? []) as Payment[];
      const policyIds = new Set(policies.map((p) => p.id));
      return all.filter((p: Payment & { policy_id?: string }) =>
        policyIds.has((p as { policy_id: string }).policy_id)
      );
    },
    enabled: tab === "Payments" && policies.length > 0,
  });

  if (!customer) return <DetailSkeleton />;

  const initials = customer.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <Card className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lic-blue-50 text-lg font-semibold">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{customer.full_name}</h1>
            <p className="text-sm text-lic-neutral-500">
              {customer.customer_code} · {customer.phone}
            </p>
            <Badge className="mt-2">{customer.kyc_status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/customers/${customerId}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Link href={`/dashboard/policies/new?customer=${customerId}`}>
            <Button>Add policy</Button>
          </Link>
        </div>
      </Card>

      <nav className="mb-4 flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm ${
              tab === t ? "border-lic-yellow-400 font-medium" : "border-transparent text-lic-neutral-500"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Personal" && (
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          {[
            ["Email", customer.email],
            ["City", `${customer.city}, ${customer.state}`],
            ["PAN", customer.pan_number],
            ["Nominee", customer.nominee_name],
            ["DOB", customer.date_of_birth ? formatDateIST(customer.date_of_birth) : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-lic-neutral-500">{k}</dt>
              <dd>{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab === "Policies" && (
        <div className="overflow-x-auto rounded-card border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-lic-blue-50">
                {["Policy #", "Plan", "Premium", "Next due", "Status", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs uppercase text-lic-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-3 py-2">{p.policy_number}</td>
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

      {tab === "Payments" && (
        <ul className="space-y-2 text-sm">
          {(paymentsData ?? []).map((pay) => (
            <li key={pay.id} className="rounded-card border bg-white p-3">
              #{pay.installment_number} · {formatDateIST(pay.payment_date)} · {formatINR(Number(pay.amount_paid))}
              <Badge className="ml-2">{pay.status}</Badge>
            </li>
          ))}
        </ul>
      )}

      {tab === "KYC" && <KycDocuments customerId={customerId} />}
    </div>
  );
}
