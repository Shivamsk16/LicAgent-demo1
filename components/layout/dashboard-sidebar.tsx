"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Upload,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTenantStore } from "@/store/tenant";

const baseNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/policies", label: "Policies", icon: FileText },
  { href: "/dashboard/payments", label: "Payments", icon: Wallet },
  { href: "/dashboard/payments/record", label: "Record payment", icon: CreditCard },
  { href: "/dashboard/reminders", label: "Reminders", icon: Bell },
  { href: "/dashboard/commission", label: "Commission", icon: IndianRupee },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const tenantName = useTenantStore((s) => s.tenantName);
  const isManager = useTenantStore((s) => s.isManager);
  const role = useTenantStore((s) => s.role);

  const nav = [
    ...baseNav,
    ...(isManager || role === "senior_agent"
      ? [
          { href: "/dashboard/import", label: "Import", icon: Upload },
          { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
        ]
      : []),
    ...(role === "branch_manager"
      ? [
          { href: "/dashboard/team", label: "Team", icon: UserCog },
          { href: "/dashboard/audit", label: "Audit", icon: ClipboardList },
        ]
      : []),
  ];

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-lic-neutral-200 bg-lic-yellow-50">
      <div className="border-b border-lic-neutral-200 bg-white p-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-lic-yellow-400 text-xs font-bold">
          LIC
        </div>
        <p className="mt-2 text-xs font-medium text-lic-neutral-800">
          {tenantName ?? "Branch"}
        </p>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-lic-yellow-400 text-lic-neutral-800"
                  : "text-lic-neutral-500 hover:bg-lic-yellow-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
