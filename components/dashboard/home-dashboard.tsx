"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton, StatGridSkeleton } from "@/components/ui/skeleton";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { differenceInDays } from "date-fns";

function daysLeftChip(due: string) {
  const days = differenceInDays(new Date(due), new Date());
  if (days < 0) return <Badge variant="suspended">Overdue {Math.abs(days)}d</Badge>;
  if (days === 0) return <Badge variant="suspended">Today</Badge>;
  if (days <= 7) return <Badge variant="trial">{days}d left</Badge>;
  return <Badge>{days}d left</Badge>;
}

export function HomeDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <StatGridSkeleton count={5} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-48 animate-pulse rounded-card bg-lic-neutral-200" />
          <div className="h-48 animate-pulse rounded-card bg-lic-neutral-200" />
        </div>
      </div>
    );
  }
  if (!data) return null;

  const greeting = `Good morning · ${format(new Date(), "dd MMM yyyy")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold">{greeting}</h1>
        <p className="text-sm text-lic-neutral-500">{data.tenantName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="My customers" value={data.customerCount} accent="blue" />
        <StatCard label="Active policies" value={data.activePolicies} accent="green" />
        <StatCard label="Premiums due (month)" value={data.premiumsDueThisMonth} accent="amber" />
        <StatCard
          label="Overdue"
          value={data.overdueCount}
          accent={data.overdueCount > 0 ? "amber" : "blue"}
        />
        <StatCard label="Commission (month)" value={formatINR(data.commissionMonth)} accent="yellow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Due this week</CardTitle>
          <ul className="mt-4 divide-y divide-lic-neutral-200">
            {(data.dueThisWeek as Array<{
              id: string;
              policy_number: string;
              plan_name: string;
              premium_amount: number;
              next_premium_due: string;
              customer: { full_name: string };
            }>).length === 0 && (
              <li className="py-4 text-sm text-lic-neutral-500">No premiums due this week.</li>
            )}
            {(data.dueThisWeek as Array<{
              id: string;
              policy_number: string;
              plan_name: string;
              premium_amount: number;
              next_premium_due: string;
              customer: { full_name: string };
            }>).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium">{p.customer?.full_name}</p>
                  <p className="text-lic-neutral-500">
                    {p.policy_number} · {p.plan_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {daysLeftChip(p.next_premium_due)}
                  <span>{formatINR(Number(p.premium_amount))}</span>
                  <Link href={`/dashboard/payments/record?policy=${p.id}`}>
                    <Button size="sm">Record</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Recent payments</CardTitle>
          <ul className="mt-4 space-y-3 text-sm">
            {(data.recentPayments as Array<{
              id: string;
              payment_date: string;
              amount_paid: number;
              receipt_number: string | null;
              customer: { full_name: string };
              policy: { policy_number: string };
            }>).map((pay) => (
              <li key={pay.id}>
                <Link href={`/dashboard/payments/${pay.id}`} className="hover:text-lic-blue-400">
                  <p className="font-medium">{pay.customer?.full_name}</p>
                  <p className="text-lic-neutral-500">
                    {formatDateIST(pay.payment_date)} · {formatINR(Number(pay.amount_paid))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
