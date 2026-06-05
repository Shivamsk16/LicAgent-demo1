"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Tenant } from "@/types/database";
import type { DashboardRole } from "@/lib/auth/dashboard-context";
import { formatDateIST } from "@/lib/utils/dates";
import { BarChart3, ClipboardList, Upload } from "lucide-react";

export function BranchSettings({
  tenant,
  role,
  isManager,
}: {
  tenant: Tenant;
  role: DashboardRole;
  isManager: boolean;
}) {
  const adminLinks = [
    ...(isManager
      ? [{ href: "/dashboard/import", label: "Bulk import", icon: Upload, description: "Import customers, policies, or payments from CSV" }]
      : []),
    ...(role === "branch_manager"
      ? [{ href: "/dashboard/audit", label: "Audit log", icon: ClipboardList, description: "View branch activity and changes" }]
      : []),
    ...(isManager
      ? [{ href: "/dashboard/reports", label: "Reports", icon: BarChart3, description: "Branch analytics and exports" }]
      : []),
  ];

  return (
    <div className="section-gap max-w-2xl">
      <PageHeader
        title="Settings"
        description="Branch workspace and account preferences"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <Card padding="lg">
        <h2 className="text-sm font-semibold text-lic-neutral-900">Branch</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-lic-neutral-500">Name</dt>
            <dd className="font-medium text-lic-neutral-900">{tenant.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-lic-neutral-500">Branch code</dt>
            <dd className="font-mono text-lic-neutral-900">{tenant.branch_code}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-lic-neutral-500">Plan</dt>
            <dd><Badge>{tenant.plan}</Badge></dd>
          </div>
          {tenant.trial_ends_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-lic-neutral-500">Trial ends</dt>
              <dd>{formatDateIST(tenant.trial_ends_at)}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card padding="lg">
        <h2 className="text-sm font-semibold text-lic-neutral-900">Your access</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-lic-neutral-500">Role</dt>
            <dd className="capitalize">{role.replace(/_/g, " ")}</dd>
          </div>
        </dl>
        <Link href="/select-tenant" className="mt-4 inline-block">
          <Button variant="secondary" size="sm">Switch branch</Button>
        </Link>
      </Card>

      {adminLinks.length > 0 && (
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-lic-neutral-900">Administration</h2>
          <ul className="mt-4 divide-y divide-lic-neutral-150">
            {adminLinks.map(({ href, label, icon: Icon, description }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 py-3 transition-colors hover:text-lic-neutral-900"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-lic-neutral-50 ring-1 ring-inset ring-lic-neutral-200">
                    <Icon className="h-4 w-4 text-lic-neutral-500" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-lic-neutral-900">{label}</p>
                    <p className="text-xs text-lic-neutral-500">{description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
