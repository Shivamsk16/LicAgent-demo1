"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import type { Payment } from "@/types/business";

export function PaymentReceipt({ paymentId }: { paymentId: string }) {
  const { data: payment, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/${paymentId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load payment");
      return json.data as Payment;
    },
  });

  if (isLoading) {
    return (
      <div className="section-gap">
        <Skeleton className="h-8 w-64" />
        <Card className="max-w-md space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="error" title="Could not load receipt">
        {error instanceof Error ? error.message : "Something went wrong."}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
          <Link href="/dashboard/payments">
            <Button size="sm" variant="ghost">Back to payments</Button>
          </Link>
        </div>
      </Alert>
    );
  }

  if (!payment) {
    return (
      <Alert variant="error" title="Receipt not found">
        This payment may have been removed or you may not have access.
        <Link href="/dashboard/payments" className="mt-2 block text-xs font-medium underline">
          Back to payments
        </Link>
      </Alert>
    );
  }

  const total = Number(payment.amount_paid) + Number(payment.late_fee ?? 0);
  const policyNumber = payment.policy?.policy_number ?? "Payment";
  const customerName = payment.customer?.full_name ?? "";

  return (
    <div className="section-gap">
      <PageHeader
        title={`Receipt ${payment.receipt_number ?? payment.installment_number}`}
        description={`${customerName} · ${policyNumber}`}
        backHref="/dashboard/payments"
        backLabel="Back to payments"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Payments", href: "/dashboard/payments" },
          { label: `Receipt #${payment.installment_number}` },
        ]}
      />

      <Card className="max-w-md">
        <h2 className="text-lg font-semibold">Payment receipt</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Customer</dt><dd>{payment.customer?.full_name}</dd></div>
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Policy</dt><dd>{payment.policy?.policy_number}</dd></div>
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Installment</dt><dd>#{payment.installment_number}</dd></div>
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Payment date</dt><dd>{formatDateIST(payment.payment_date)}</dd></div>
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Due date</dt><dd>{formatDateIST(payment.due_date)}</dd></div>
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Amount paid</dt><dd>{formatINR(Number(payment.amount_paid))}</dd></div>
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Late fee</dt><dd>{formatINR(Number(payment.late_fee ?? 0))}</dd></div>
          <div className="flex justify-between border-t pt-2 font-semibold"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Receipt #</dt><dd>{payment.receipt_number ?? "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-lic-neutral-500">Recorded by</dt><dd>{payment.recorder?.full_name}</dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {payment.policy_id && (
            <Link href={`/dashboard/policies/${payment.policy_id}`}>
              <Button variant="secondary" size="sm">View policy</Button>
            </Link>
          )}
          <Link href="/dashboard/payments">
            <Button variant="ghost" size="sm">Back to ledger</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
