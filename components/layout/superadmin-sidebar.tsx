"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Percent,
  ScrollText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const nav = [
  { href: "/superadmin", label: "Overview", icon: LayoutDashboard },
  { href: "/superadmin/tenants", label: "Branches", icon: Building2 },
  { href: "/superadmin/commission-rates", label: "Commission Rates", icon: Percent },
  { href: "/superadmin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/superadmin/settings", label: "Settings", icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-lic-neutral-200 bg-lic-yellow-50">
      <div className="border-b border-lic-neutral-200 bg-white p-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-lic-yellow-400 text-xs font-bold text-lic-neutral-800">
          LIC
        </div>
        <p className="mt-2 text-xs text-lic-neutral-500">Platform Admin</p>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/superadmin"
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
                  : "text-lic-neutral-500 hover:bg-lic-yellow-100 hover:text-lic-neutral-800"
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
