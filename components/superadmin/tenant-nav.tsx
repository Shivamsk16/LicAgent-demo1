"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import type { Tenant } from "@/types/database";

const tabs = [
  { href: (id: string) => `/superadmin/tenants/${id}`, label: "Overview" },
  { href: (id: string) => `/superadmin/tenants/${id}/members`, label: "Members" },
  { href: (id: string) => `/superadmin/tenants/${id}/audit`, label: "Audit log" },
  { href: (id: string) => `/superadmin/tenants/${id}/settings`, label: "Settings" },
];

export function TenantNav({ tenant }: { tenant: Tenant }) {
  const pathname = usePathname();

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[22px] font-semibold">{tenant.name}</h1>
        <Badge variant={tenant.plan as "trial"}>{tenant.plan}</Badge>
        <Badge variant={tenant.status as "active"}>{tenant.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-lic-neutral-500">
        {tenant.branch_code} · {tenant.city}, {tenant.state}
      </p>
      <nav className="mt-4 flex gap-1 border-b border-lic-neutral-200">
        {tabs.map((tab) => {
          const href = tab.href(tenant.id);
          const active =
            href === `/superadmin/tenants/${tenant.id}`
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-lic-yellow-400 text-lic-neutral-800"
                  : "border-transparent text-lic-neutral-500 hover:text-lic-neutral-800"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
