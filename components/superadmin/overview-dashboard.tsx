"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Building2,
  FileText,
  IndianRupee,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TenantsTable } from "@/components/superadmin/tenants-table";
import { Alert } from "@/components/ui/alert";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { StatGridSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import type { TenantWithStats } from "@/types/database";

const SignupsChart = dynamic(
  () =>
    import("@/components/charts/signups-chart").then((m) => ({
      default: m.SignupsChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const PlanDonutChart = dynamic(
  () =>
    import("@/components/charts/plan-donut").then((m) => ({
      default: m.PlanDonutChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export function OverviewDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/superadmin/stats");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as {
        totalBranches: number;
        activeBranches: number;
        trialBranches: number;
        totalAgents: number;
        activePolicies: number;
        platformMRR: number;
        expiringTrials: { id: string; name: string; trial_ends_at: string }[];
        recentTenants: TenantWithStats[];
        signupsByMonth: { month: string; count: number }[];
        planBreakdown: { name: string; value: number }[];
      };
    },
  });

  if (isLoading) {
    return (
      <div className="section-gap">
        <StatGridSkeleton count={6} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="error" title="Could not load platform stats">
        {error instanceof Error ? error.message : "Failed to load stats. Check Supabase env."}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert variant="warning" title="No platform data">
        Platform stats are unavailable right now.
      </Alert>
    );
  }

  return (
    <div className="section-stack">
      <StatGrid className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total branches" value={data.totalBranches} accent="blue" icon={Building2} />
        <StatCard label="Active branches" value={data.activeBranches} accent="green" icon={Building2} />
        <StatCard label="Trial branches" value={data.trialBranches} accent="amber" icon={TrendingUp} />
        <StatCard label="Total agents" value={data.totalAgents} accent="blue" icon={Users} />
        <StatCard label="Active policies" value={data.activePolicies} accent="green" icon={FileText} />
        <StatCard label="Platform MRR" value={formatINR(data.platformMRR)} accent="yellow" icon={IndianRupee} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle description="New branch signups per month">
              Monthly signups
            </CardTitle>
          </CardHeader>
          <SignupsChart data={data.signupsByMonth} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle description="Distribution by subscription plan">
              Plans breakdown
            </CardTitle>
          </CardHeader>
          <PlanDonutChart data={data.planBreakdown} />
        </Card>
      </div>

      {data.expiringTrials.length > 0 && (
        <Card className="border-lic-amber-100 bg-lic-amber-50/50">
          <CardHeader>
            <CardTitle description="Branches with trials ending soon">
              Trial expiring in 7 days
            </CardTitle>
          </CardHeader>
          <ul className="space-y-2">
            {data.expiringTrials.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors hover:bg-lic-amber-50"
              >
                <span className="text-lic-neutral-700">
                  {t.name} · ends {formatDateIST(t.trial_ends_at)}
                </span>
                <Link href={`/superadmin/tenants/${t.id}/settings`}>
                  <Button size="sm" variant="secondary">
                    Upgrade
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-lic-neutral-900">
            Recent branches
          </h2>
          <Link href="/superadmin/tenants">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>
        <TenantsTable tenants={data.recentTenants} />
      </div>
    </div>
  );
}
