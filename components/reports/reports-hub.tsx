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
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={
          canExport
            ? "View and export branch analytics"
            : "View branch analytics (export requires manager or senior agent)"
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((report) => {
          const Icon = ICONS[report.chartType] ?? BarChart3;
          return (
            <Link
              key={report.id}
              href={`/dashboard/reports/${report.id}`}
              className="rounded-card border bg-white p-5 shadow-card transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-btn bg-lic-blue-50">
                  <Icon className="h-5 w-5 text-lic-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lic-neutral-800">
                    {report.name}
                  </h3>
                  <p className="mt-1 text-xs text-lic-neutral-500">
                    {report.description}
                  </p>
                  {report.managerOnly && (
                    <span className="mt-2 inline-block text-[10px] uppercase tracking-wide text-lic-neutral-400">
                      Manager
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
