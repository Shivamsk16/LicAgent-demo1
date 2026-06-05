"use client";

import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function AppTopbar({
  title,
  subtitle,
  mobileOpen,
  onMenuToggle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  mobileOpen?: boolean;
  onMenuToggle?: () => void;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("topbar", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lic-neutral-600 transition-colors duration-fast ease-out hover:bg-black/[0.04] lg:hidden"
            onClick={onMenuToggle}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-lic-neutral-900">
            {title}
          </p>
          {subtitle && (
            <p className="hidden truncate text-2xs text-lic-neutral-500 sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
