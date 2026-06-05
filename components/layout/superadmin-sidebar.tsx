"use client";

import {
  Building2,
  LayoutDashboard,
  Percent,
  ScrollText,
  Settings,
} from "lucide-react";
import { SidebarNav, type NavSection } from "./sidebar-nav";

const sections: NavSection[] = [
  {
    items: [
      { href: "/superadmin", label: "Overview", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/superadmin/tenants", label: "Branches", icon: Building2 },
      { href: "/superadmin/commission-rates", label: "Commission rates", icon: Percent },
      { href: "/superadmin/audit", label: "Audit log", icon: ScrollText },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/superadmin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function SuperAdminSidebar() {
  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-black/[0.06] bg-lic-neutral-50"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex h-[var(--topbar-height)] items-center gap-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lic-neutral-900 text-2xs font-bold text-white">
          LIC
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-tight text-lic-neutral-900">
            Platform
          </p>
          <p className="truncate text-2xs text-lic-neutral-500">Super admin</p>
        </div>
      </div>
      <SidebarNav sections={sections} />
    </aside>
  );
}
