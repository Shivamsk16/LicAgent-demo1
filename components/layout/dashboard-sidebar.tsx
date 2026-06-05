"use client";

import {
  BarChart3,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Mail,
  Settings,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useTenantStore } from "@/store/tenant";
import { SidebarNav, type NavSection } from "./sidebar-nav";

export function DashboardSidebar() {
  const tenantName = useTenantStore((s) => s.tenantName);
  const isManager = useTenantStore((s) => s.isManager);
  const role = useTenantStore((s) => s.role);

  const sections: NavSection[] = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/dashboard/customers", label: "Customers", icon: Users },
        { href: "/dashboard/policies", label: "Policies", icon: FileText },
        { href: "/dashboard/payments", label: "Payments", icon: Wallet },
      ],
    },
  ];

  if (isManager) {
    sections.push({
      label: "Analytics",
      items: [
        { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
        { href: "/dashboard/commission", label: "Commissions", icon: IndianRupee },
      ],
    });
  }

  if (role === "branch_manager") {
    sections.push({
      label: "Team",
      items: [
        { href: "/dashboard/team", label: "Team", icon: UserCog },
        { href: "/dashboard/team/invites", label: "Invites", icon: Mail },
      ],
    });
  }

  sections.push({
    label: "System",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  });

  return (
    <aside
      className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-black/[0.06] bg-lic-neutral-50"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex h-[var(--topbar-height)] items-center gap-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lic-neutral-900 text-2xs font-bold text-white">
          LIC
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-tight text-lic-neutral-900">
            {tenantName ?? "Branch"}
          </p>
          <p className="truncate text-2xs text-lic-neutral-500">Workspace</p>
        </div>
      </div>
      <SidebarNav sections={sections} />
    </aside>
  );
}
