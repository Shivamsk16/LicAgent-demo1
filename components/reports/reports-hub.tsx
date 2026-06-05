"use client";

import Link from "next/link";
import { REPORT_CATALOG } from "@/lib/reports/types";
import { PageHeader } from "@/components/shared/page-header";
import { useTenantStore } from "@/store/tenant";
import {
  BarChart3,
  FileSpreadsheet,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";

const ICONS: Record<string, typeof BarChart3> = {
  bar: BarChart3,
  horizontalBar: Users,
  donut: PieChart,
  line: TrendingUp,
  table: FileSpreadsheet,
  timeline: TrendingUp,
  summary: BarChart3,
};

export function ReportsHub() {
  const isManager = useTenantStore((s) => s.isManager);
  const role = useTenantStore((s) => s.role);
  const canExport = isManager || role === "senior_agent";

  const visible = REPORT_CATALOG.filter(
    (r) => !r.managerOnly || isManager
  );

  return (
    <div className="section-gap">
      <PageHeader
        title="Reports"
        description={
          canExport
            ? "View and export branch analytics"
            : "View branch analytics (export requires manager or senior agent)"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reports" },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((report) => {
          const Icon = ICONS[report.chartType] ?? BarChart3;
          return (
            <Link
              key={report.id}
              href={`/dashboard/reports/${report.id}`}
              className="group rounded-xl bg-lic-neutral-0 p-5 ring-1 ring-black/[0.06] transition-[box-shadow,transform] duration-fast ease-out hover:ring-black/[0.1] active:scale-[0.99]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lic-neutral-100 transition-colors duration-fast group-hover:bg-lic-neutral-200/60">
                  <Icon className="h-5 w-5 text-lic-neutral-600" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight text-lic-neutral-900">
                    {report.name}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-lic-neutral-500">
                    {report.description}
                  </p>
                  {report.managerOnly && (
                    <span className="mt-2 inline-block text-2xs font-medium text-lic-neutral-400">
                      Manager only
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
