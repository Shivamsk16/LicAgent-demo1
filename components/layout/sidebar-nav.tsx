"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export function SidebarNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact || href === "/dashboard" || href === "/superadmin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
      {sections.map((section, si) => (
        <div key={si}>
          {section.label && (
            <p className="sidebar-section-label">{section.label}</p>
          )}
          <ul className="space-y-0.5">
            {section.items.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "sidebar-link",
                      active && "sidebar-link-active"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
