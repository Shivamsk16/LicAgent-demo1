"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function MobileFilterSheet({
  children,
  activeCount = 0,
  className,
}: {
  children: React.ReactNode;
  activeCount?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("md:hidden", className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-expanded={open}
      >
        <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lic-neutral-900 px-1 text-2xs font-medium text-white">
            {activeCount}
          </span>
        )}
      </Button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-overlay bg-black/30"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed inset-x-0 bottom-0 z-modal max-h-[70vh] overflow-y-auto rounded-t-xl bg-lic-neutral-0 p-5 pb-8 shadow-lg ring-1 ring-black/[0.08]"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-lic-neutral-900">Filters</p>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
            <div className="flex flex-col gap-4">{children}</div>
          </div>
        </>
      )}
    </div>
  );
}
