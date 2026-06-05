"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import type { Payment } from "@/types/business";

export function PaymentReceipt({ paymentId }: { paymentId: string }) {
  const { data: payment } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/${paymentId}`);
      const json = await res.json();
      return json.data as Payment;
    },
  });

  if (!payment) return <p className="text-sm text-lic-neutral-500">Loading…</p>;

  const total = Number(payment.amount_paid) + Number(payment.late_fee ?? 0);

  return (
    <Card className="max-w-md">
      <h1 className="text-lg font-semibold">Payment receipt</h1>
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
      <Link href="/dashboard/payments" className="mt-6 inline-block">
        <Button variant="secondary">Back to ledger</Button>
      </Link>
    </Card>
  );
}
