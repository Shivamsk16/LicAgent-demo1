"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format, getHours } from "date-fns";
import {
  AlertCircle,
  CalendarClock,
  FileText,
  IndianRupee,
  Plus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Skeleton, StatGridSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SetupChecklist } from "@/components/onboarding/setup-checklist";
import { DashboardInsights, buildInsights } from "@/components/dashboard/dashboard-insights";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { differenceInDays } from "date-fns";

function greetingForHour(h: number) {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function daysLeftChip(due: string) {
  const days = differenceInDays(new Date(due), new Date());
  if (days < 0)
    return (
      <Badge variant="error" dot>
        Overdue {Math.abs(days)}d
      </Badge>
    );
  if (days === 0)
    return (
      <Badge variant="error" dot>
        Due today
      </Badge>
    );
  if (days <= 7)
    return (
      <Badge variant="warning" dot>
        {days}d left
      </Badge>
    );
  return <Badge dot>{days}d left</Badge>;
}

const quickActions = [
  { href: "/dashboard/payments/record", label: "Record payment", icon: Wallet, primary: true },
  { href: "/dashboard/customers?new=1", label: "Add customer", icon: UserPlus },
  { href: "/dashboard/policies/new", label: "Add policy", icon: FileText },
  { href: "/dashboard/reminders", label: "View reminders", icon: CalendarClock },
];

type DashboardStatsData = {
  tenantName: string;
  role: string;
  customerCount: number;
  activePolicies: number;
  premiumsDueThisMonth: number;
  overdueCount: number;
  kycPending: number;
  paymentCount: number;
  commissionMonth: number;
  dueThisWeek: unknown[];
  recentPayments: unknown[];
  isManager: boolean;
};

export function HomeDashboard({
  initialData,
}: {
  initialData?: DashboardStatsData;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as DashboardStatsData;
    },
    initialData,
    staleTime: initialData ? 60_000 : 0,
    refetchOnMount: initialData ? false : true,
    refetchOnWindowFocus: false,
  });

  const dateStr = format(new Date(), "EEEE, d MMMM yyyy");
  const greeting = greetingForHour(getHours(new Date()));

  if (isLoading) {
    return (
      <div className="section-stack">
        <Skeleton className="h-16 w-80" />
        <StatGridSkeleton count={5} />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="section-stack">
        <PageHeader title={greeting} description={dateStr} />
        <Alert variant="error" title="Could not load dashboard">
          {error instanceof Error ? error.message : "Something went wrong."}
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-xs font-medium underline"
          >
            Try again
          </button>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="warning" title="No dashboard data">
        Dashboard stats are unavailable right now.
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 text-xs font-medium underline"
        >
          Try again
        </button>
      </Alert>
    );
  }

  const dueWeek = data.dueThisWeek as Array<{
    id: string;
    policy_number: string;
    plan_name: string;
    premium_amount: number;
    next_premium_due: string;
    customer: { full_name: string };
  }>;

  const recentPayments = data.recentPayments as Array<{
    id: string;
    payment_date: string;
    amount_paid: number;
    customer: { full_name: string };
    policy: { policy_number: string };
  }>;

  const insights = buildInsights({
    overdueCount: data.overdueCount,
    kycPending: data.kycPending,
    premiumsDueThisMonth: data.premiumsDueThisMonth,
    customerCount: data.customerCount,
    activePolicies: data.activePolicies,
  });

  return (
    <div className="section-stack">
      <PageHeader
        title={greeting}
        description={`${dateStr} · ${data.tenantName}`}
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <SetupChecklist
        customerCount={data.customerCount}
        policyCount={data.activePolicies}
        paymentCount={data.paymentCount}
      />

      {insights.length > 0 && <DashboardInsights insights={insights} />}

      <div className="flex flex-wrap items-center gap-2">
        {quickActions.map(({ href, label, icon: Icon, primary }) => (
          <Link key={href} href={href}>
            <Button size="sm" variant={primary ? "primary" : "secondary"}>
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {label}
            </Button>
          </Link>
        ))}
      </div>

      <StatGrid>
        <StatCard
          label="My customers"
          value={data.customerCount}
          accent="blue"
          icon={Users}
          href="/dashboard/customers"
        />
        <StatCard
          label="Active policies"
          value={data.activePolicies}
          accent="green"
          icon={FileText}
          href="/dashboard/policies?status=in_force"
        />
        <StatCard
          label="Premiums due this month"
          value={data.premiumsDueThisMonth}
          accent="amber"
          icon={CalendarClock}
          href="/dashboard/reminders"
        />
        <StatCard
          label="Overdue"
          value={data.overdueCount}
          accent={data.overdueCount > 0 ? "red" : "neutral"}
          icon={AlertCircle}
          href="/dashboard/reminders"
          urgent={data.overdueCount > 0}
        />
        <StatCard
          label="Commission this month"
          value={formatINR(data.commissionMonth)}
          accent="yellow"
          icon={IndianRupee}
          href="/dashboard/commission"
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="surface-panel lg:col-span-3">
          <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-lic-neutral-900">
                Due this week
              </h2>
              <p className="mt-1 text-[13px] text-lic-neutral-500">
                Premiums due in the next 7 days
              </p>
            </div>
            {dueWeek.length > 0 && (
              <Badge variant="warning">{dueWeek.length} due</Badge>
            )}
          </div>
          {dueWeek.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarClock}
              title="All clear this week"
              description="No premiums due in the next 7 days."
              actionLabel="View all policies"
              actionHref="/dashboard/policies"
            />
          ) : (
            <ul className="divide-y divide-black/[0.04]">
              {dueWeek.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 text-[13px] transition-colors duration-fast ease-out hover:bg-black/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-lic-neutral-900">
                      {p.customer?.full_name}
                    </p>
                    <p className="mt-0.5 text-xs text-lic-neutral-500">
                      {p.policy_number} · {p.plan_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {daysLeftChip(p.next_premium_due)}
                    <span className="data-value text-sm">
                      {formatINR(Number(p.premium_amount))}
                    </span>
                    <Link href={`/dashboard/payments/record?policy=${p.id}`}>
                      <Button size="sm" variant="secondary">
                        <Plus className="h-3.5 w-3.5" />
                        Record
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-panel lg:col-span-2">
          <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-lic-neutral-900">
                Recent activity
              </h2>
              <p className="mt-1 text-[13px] text-lic-neutral-500">
                Latest recorded payments
              </p>
            </div>
            <Link href="/dashboard/payments">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <EmptyState
              compact
              icon={Wallet}
              title="No payments yet"
              description="Record a premium payment to see activity here."
              actionLabel="Record payment"
              actionHref="/dashboard/payments/record"
            />
          ) : (
            <ul className="divide-y divide-black/[0.04]">
              {recentPayments.map((pay) => (
                <li key={pay.id}>
                  <Link
                    href={`/dashboard/payments/${pay.id}`}
                    className="group flex items-center gap-3 px-6 py-4 transition-colors duration-fast ease-out hover:bg-black/[0.02]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lic-neutral-100 transition-colors duration-fast group-hover:bg-lic-neutral-200/60">
                      <Wallet className="h-4 w-4 text-lic-neutral-500" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-lic-neutral-900">
                        {pay.customer?.full_name}
                      </p>
                      <p className="mt-0.5 text-xs text-lic-neutral-500">
                        {formatDateIST(pay.payment_date)} ·{" "}
                        <span className="data-value">
                          {formatINR(Number(pay.amount_paid))}
                        </span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
