"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignupsChart } from "@/components/charts/signups-chart";
import { PlanDonutChart } from "@/components/charts/plan-donut";
import { TenantsTable } from "@/components/superadmin/tenants-table";
import { formatINR } from "@/lib/utils/currency";
import { formatDateIST } from "@/lib/utils/dates";
import { StatGridSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import type { TenantWithStats } from "@/types/database";

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
      <div className="space-y-6">
        <StatGridSkeleton count={5} />
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
      <p className="text-sm text-lic-red-600">
        {error instanceof Error ? error.message : "Failed to load stats. Check Supabase env."}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total branches" value={data.totalBranches} accent="blue" />
        <StatCard label="Active branches" value={data.activeBranches} accent="green" />
        <StatCard label="Trial branches" value={data.trialBranches} accent="amber" />
        <StatCard label="Total agents" value={data.totalAgents} accent="blue" />
        <StatCard label="Active policies" value={data.activePolicies} accent="green" />
        <StatCard label="Platform MRR" value={formatINR(data.platformMRR)} accent="yellow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Monthly new signups</CardTitle>
          <div className="mt-4">
            <SignupsChart data={data.signupsByMonth} />
          </div>
        </Card>
        <Card>
          <CardTitle>Plans breakdown</CardTitle>
          <div className="mt-4">
            <PlanDonutChart data={data.planBreakdown} />
          </div>
        </Card>
      </div>

      {data.expiringTrials.length > 0 && (
        <Card className="border-lic-amber-600/30 bg-lic-amber-100/30">
          <CardTitle>Trial expiring in 7 days</CardTitle>
          <ul className="mt-3 space-y-2">
            {data.expiringTrials.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent branches</h2>
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
