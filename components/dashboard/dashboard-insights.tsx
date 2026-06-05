import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type DashboardInsight = {
  id: string;
  title: string;
  description: string;
  href: string;
  variant: "default" | "warning" | "success";
  metric?: string | number;
};

export function DashboardInsights({ insights }: { insights: DashboardInsight[] }) {
  if (insights.length === 0) return null;

  const icons = {
    default: TrendingUp,
    warning: AlertTriangle,
    success: UserCheck,
  };

  return (
    <section aria-labelledby="insights-title">
      <h2 id="insights-title" className="mb-4 text-sm font-semibold tracking-tight text-lic-neutral-900">
        Insights
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const Icon = icons[insight.variant];
          return (
            <Link
              key={insight.id}
              href={insight.href}
              className={cn(
                "group flex items-start gap-4 rounded-xl p-4 ring-1 transition-[box-shadow,transform] duration-fast ease-out active:scale-[0.99]",
                insight.variant === "warning" && "bg-lic-amber-50/50 ring-lic-amber-600/15 hover:ring-lic-amber-600/25",
                insight.variant === "success" && "bg-lic-green-50/40 ring-lic-green-600/10 hover:ring-lic-green-600/20",
                insight.variant === "default" && "bg-lic-neutral-0 ring-black/[0.06] hover:ring-black/[0.1]"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  insight.variant === "warning" && "bg-lic-amber-100 text-lic-amber-700",
                  insight.variant === "success" && "bg-lic-green-100 text-lic-green-700",
                  insight.variant === "default" && "bg-lic-neutral-100 text-lic-neutral-600"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-lic-neutral-900">{insight.title}</p>
                  {insight.metric !== undefined && (
                    <span className="font-mono text-sm font-semibold tabular-nums text-lic-neutral-900">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-lic-neutral-500">{insight.description}</p>
              </div>
              <ArrowRight
                className="mt-0.5 h-4 w-4 shrink-0 text-lic-neutral-300 transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-lic-neutral-500"
                strokeWidth={1.75}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function buildInsights(stats: {
  overdueCount: number;
  kycPending?: number;
  premiumsDueThisMonth: number;
  customerCount: number;
  activePolicies: number;
}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (stats.overdueCount > 0) {
    insights.push({
      id: "overdue",
      title: "Overdue premiums",
      description: "Policies past due date need follow-up",
      href: "/dashboard/reminders",
      variant: "warning",
      metric: stats.overdueCount,
    });
  }

  if (stats.kycPending && stats.kycPending > 0) {
    insights.push({
      id: "kyc",
      title: "KYC pending review",
      description: "Customers awaiting verification",
      href: "/dashboard/customers?kyc=pending",
      variant: "warning",
      metric: stats.kycPending,
    });
  }

  if (stats.premiumsDueThisMonth > 0) {
    insights.push({
      id: "due-month",
      title: "Due this month",
      description: "Premiums scheduled for collection",
      href: "/dashboard/policies?status=in_force",
      variant: "default",
      metric: stats.premiumsDueThisMonth,
    });
  }

  if (stats.customerCount > 0 && stats.activePolicies === 0) {
    insights.push({
      id: "no-policies",
      title: "Add policies",
      description: "You have customers but no active policies yet",
      href: "/dashboard/policies/new",
      variant: "default",
    });
  }

  if (insights.length === 0 && stats.customerCount > 0) {
    insights.push({
      id: "healthy",
      title: "Portfolio healthy",
      description: `${stats.activePolicies} active policies across ${stats.customerCount} customers`,
      href: "/dashboard/reports",
      variant: "success",
    });
  }

  return insights.slice(0, 3);
}
