"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/shared/page-header";
import { PremiumTimeline } from "./premium-timeline";
import { formatDateIST } from "@/lib/utils/dates";
import { formatINR } from "@/lib/utils/currency";
import { DetailSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Policy } from "@/types/business";

export function PolicyDetail({ policyId }: { policyId: string }) {
  const [lapseOpen, setLapseOpen] = useState(false);
  const [lapseLoading, setLapseLoading] = useState(false);

  const { data: policy, refetch, isLoading, isError, error } = useQuery({
    queryKey: ["policy", policyId],
    queryFn: async () => {
      const res = await fetch(`/api/policies/${policyId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load policy");
      return json.data as Policy;
    },
  });

  async function markLapsed() {
    setLapseLoading(true);
    const res = await fetch(`/api/policies/${policyId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "lapsed", reason: "Manual" }),
    });
    setLapseLoading(false);
    setLapseOpen(false);
    if (res.ok) {
      toast.success("Policy marked as lapsed");
      refetch();
    } else {
      const json = await res.json();
      toast.error("Could not update status", json.error?.message ?? "Try again");
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <div className="section-gap">
        <Alert variant="error" title="Could not load policy">
          {error instanceof Error ? error.message : "Something went wrong."}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
            <Link href="/dashboard/policies">
              <Button size="sm" variant="ghost">Back to policies</Button>
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  if (!policy) {
    return (
      <Alert variant="error" title="Policy not found">
        This policy may have been removed or you may not have access.
        <Link href="/dashboard/policies" className="mt-2 block text-xs font-medium underline">
          Back to policies
        </Link>
      </Alert>
    );
  }

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
    <div className="section-gap">
      <PageHeader
        title={policy.policy_number}
        description={policy.plan_name}
        backHref="/dashboard/policies"
        backLabel="Back to policies"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Policies", href: "/dashboard/policies" },
          { label: policy.policy_number },
        ]}
        actions={
          <>
            <Link href={`/dashboard/payments/record?policy=${policyId}`}>
              <Button>Record payment</Button>
            </Link>
            {policy.status === "in_force" && (
              <Button variant="danger" size="sm" onClick={() => setLapseOpen(true)}>Mark lapsed</Button>
            )}
            {policy.status === "lapsed" && (
              <Link href={`/dashboard/policies/${policyId}/revival`}>
                <Button variant="secondary" size="sm">Initiate revival</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge>{policy.policy_type}</Badge>
        <Badge variant={policy.status === "in_force" ? "active" : "suspended"}>{policy.status}</Badge>
        <span className="text-[13px] text-lic-neutral-500">
          <Link href={`/dashboard/customers/${policy.customer_id}`} className="text-lic-blue-500 hover:underline">
            {policy.customer?.full_name}
          </Link>
          {" · "}{policy.agent?.full_name}
        </span>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-xl bg-black/[0.06] ring-1 ring-black/[0.06] sm:grid-cols-3">
        {[
          ["Sum assured", formatINR(Number(policy.sum_assured))],
          ["Premium", formatINR(Number(policy.premium_amount))],
          ["Frequency", policy.premium_frequency],
          ["Commencement", formatDateIST(policy.commencement_date)],
          ["Next due", policy.next_premium_due ? formatDateIST(policy.next_premium_due) : "—"],
          ["Maturity", policy.maturity_date ? formatDateIST(policy.maturity_date) : "—"],
        ].map(([k, v]) => (
          <div key={k} className="bg-lic-neutral-0 p-5 ring-1 ring-inset ring-black/[0.04]">
            <dt className="text-[13px] text-lic-neutral-500">{k}</dt>
            <dd className="mt-1 font-medium text-lic-neutral-900">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="surface-panel p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-lic-neutral-900">Premium timeline</h3>
        <PremiumTimeline
          totalInstallments={installments}
          payments={policy.payments ?? []}
        />
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-lic-neutral-900">Payment history</h3>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                {["#", "Paid", "Due", "Amount", "Receipt", "Status"].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(policy.payments ?? []).map((p) => (
                <TableRow key={p.id} interactive>
                  <TableCell>{p.installment_number}</TableCell>
                  <TableCell>{formatDateIST(p.payment_date)}</TableCell>
                  <TableCell>{formatDateIST(p.due_date)}</TableCell>
                  <TableCell>{formatINR(Number(p.amount_paid))}</TableCell>
                  <TableCell mono>{p.receipt_number ?? "—"}</TableCell>
                  <TableCell><Badge>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </section>

      <ConfirmModal
        open={lapseOpen}
        onClose={() => setLapseOpen(false)}
        onConfirm={markLapsed}
        title="Mark policy as lapsed?"
        description="This will change the policy status to lapsed. You can initiate a revival later if needed."
        confirmLabel="Mark lapsed"
        variant="danger"
        loading={lapseLoading}
      />
    </div>
  );
}
