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
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
          {tenant.name}
        </h1>
        <Badge variant={tenant.plan as "trial"} dot>
          {tenant.plan}
        </Badge>
        <Badge variant={tenant.status as "active"} dot>
          {tenant.status}
        </Badge>
      </div>
      <p className="mt-1.5 text-sm text-lic-neutral-500">
        {tenant.branch_code} · {tenant.city}, {tenant.state}
      </p>
      <nav className="mt-6 flex gap-1 border-b border-lic-neutral-200">
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
                "relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out",
                active
                  ? "text-lic-neutral-900"
                  : "text-lic-neutral-500 hover:text-lic-neutral-800"
              )}
            >
              {tab.label}
              {active && (
                <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-lic-neutral-900" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
