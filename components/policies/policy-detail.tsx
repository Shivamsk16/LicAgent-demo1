"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PremiumTimeline } from "./premium-timeline";
import { formatDateIST } from "@/lib/utils/dates";
import { formatINR } from "@/lib/utils/currency";
import { DetailSkeleton } from "@/components/ui/skeleton";
import type { Policy } from "@/types/business";

export function PolicyDetail({ policyId }: { policyId: string }) {
  const { data: policy, refetch } = useQuery({
    queryKey: ["policy", policyId],
    queryFn: async () => {
      const res = await fetch(`/api/policies/${policyId}`);
      const json = await res.json();
      return json.data as Policy;
    },
  });

  async function markLapsed() {
    if (!confirm("Mark this policy as lapsed?")) return;
    await fetch(`/api/policies/${policyId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "lapsed", reason: "Manual" }),
    });
    refetch();
  }

  if (!policy) return <DetailSkeleton />;

  const installments =
    (policy.premium_term_years ?? 1) *
    (policy.premium_frequency === "monthly"
      ? 12
      : policy.premium_frequency === "quarterly"
        ? 4
        : policy.premium_frequency === "half_yearly"
          ? 2
          : 1);

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{policy.policy_number}</h1>
          <p className="text-lic-neutral-500">{policy.plan_name}</p>
          <div className="mt-2 flex gap-2">
            <Badge>{policy.policy_type}</Badge>
            <Badge variant={policy.status === "in_force" ? "active" : "suspended"}>{policy.status}</Badge>
          </div>
          <p className="mt-2 text-sm">
            <Link href={`/dashboard/customers/${policy.customer_id}`} className="text-lic-blue-400">
              {policy.customer?.full_name}
            </Link>
            {" · "}{policy.agent?.full_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/policies/${policyId}/edit`}><Button variant="secondary">Edit</Button></Link>
          <Link href={`/dashboard/payments/record?policy=${policyId}`}><Button>Record payment</Button></Link>
          {policy.status === "in_force" && (
            <Button variant="danger" size="sm" onClick={markLapsed}>Mark lapsed</Button>
          )}
          {policy.status === "lapsed" && (
            <Link href={`/dashboard/policies/${policyId}/revival`}>
              <Button variant="secondary" size="sm">Initiate revival</Button>
            </Link>
          )}
        </div>
      </Card>

      <dl className="grid gap-3 sm:grid-cols-3 text-sm">
        {[
          ["Sum assured", formatINR(Number(policy.sum_assured))],
          ["Premium", formatINR(Number(policy.premium_amount))],
          ["Frequency", policy.premium_frequency],
          ["Commencement", formatDateIST(policy.commencement_date)],
          ["Next due", policy.next_premium_due ? formatDateIST(policy.next_premium_due) : "—"],
          ["Maturity", policy.maturity_date ? formatDateIST(policy.maturity_date) : "—"],
        ].map(([k, v]) => (
          <div key={k}><dt className="text-lic-neutral-500">{k}</dt><dd className="font-medium">{v}</dd></div>
        ))}
      </dl>

      <Card>
        <h3 className="mb-3 font-semibold">Premium timeline</h3>
        <PremiumTimeline
          totalInstallments={installments}
          payments={policy.payments ?? []}
        />
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">Payment history</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-lic-blue-50">
              {["#", "Paid", "Due", "Amount", "Receipt", "Status"].map((h) => (
                <th key={h} className="px-2 py-1 text-left text-xs uppercase text-lic-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(policy.payments ?? []).map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-2 py-2">{p.installment_number}</td>
                <td className="px-2 py-2">{formatDateIST(p.payment_date)}</td>
                <td className="px-2 py-2">{formatDateIST(p.due_date)}</td>
                <td className="px-2 py-2">{formatINR(Number(p.amount_paid))}</td>
                <td className="px-2 py-2">{p.receipt_number ?? "—"}</td>
                <td className="px-2 py-2"><Badge>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
