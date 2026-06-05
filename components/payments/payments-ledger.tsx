"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { Wallet } from "lucide-react";
import type { Payment } from "@/types/business";

export function PaymentsLedger() {
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const qs = new URLSearchParams({
    ...(status !== "all" && { status }),
    ...(from && { from }),
    ...(to && { to }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payments", qs.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/payments?${qs}`);
      const json = await res.json();
      return json.data as { payments: Payment[]; summary: { totalCollected: number } };
    },
  });

  const payments = data?.payments ?? [];

  return (
    <>
      <PageHeader
        title="Payment ledger"
        actions={
          <Link href="/dashboard/payments/record">
            <Button>Record payment</Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-btn border px-2 text-sm">
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-btn border px-2 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-btn border px-2 text-sm" />
      </div>
      {data?.summary && (
        <p className="mb-4 text-sm font-medium">
          Total collected: {formatINR(data.summary.totalCollected)}
        </p>
      )}
      {isLoading ? (
        <TableSkeleton rows={10} cols={10} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments recorded"
          description="Record a premium payment to see it in the ledger."
          actionLabel="Record payment"
          actionHref="/dashboard/payments/record"
        />
      ) : (
        <div className="overflow-x-auto rounded-card border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-lic-blue-50">
                {["Date", "Customer", "Policy", "#", "Paid", "Late fee", "Mode", "Receipt", "Status", ""].map((h) => (
                  <th key={h} className="px-2 py-2 text-left text-xs uppercase text-lic-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-2 py-2">{formatDateIST(p.payment_date)}</td>
                  <td className="px-2 py-2">{p.customer?.full_name}</td>
                  <td className="px-2 py-2">{p.policy?.policy_number}</td>
                  <td className="px-2 py-2">{p.installment_number}</td>
                  <td className="px-2 py-2">{formatINR(Number(p.amount_paid))}</td>
                  <td className="px-2 py-2">{formatINR(Number(p.late_fee ?? 0))}</td>
                  <td className="px-2 py-2">{p.payment_mode}</td>
                  <td className="px-2 py-2">{p.receipt_number ?? "—"}</td>
                  <td className="px-2 py-2"><Badge>{p.status}</Badge></td>
                  <td className="px-2 py-2">
                    <Link href={`/dashboard/payments/${p.id}`}><Button variant="ghost" size="sm">Receipt</Button></Link>
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
