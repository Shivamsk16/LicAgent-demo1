"use client";

import { Search } from "lucide-react";
import { useCommandPaletteStore } from "@/store/command-palette";
import { cn } from "@/lib/utils/cn";

export function CommandTrigger({ className }: { className?: string }) {
  const setOpen = useCommandPaletteStore((s) => s.setOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg bg-lic-neutral-100/80 text-[13px] text-lic-neutral-500 ring-1 ring-inset ring-black/[0.06] transition-colors duration-fast ease-out hover:bg-lic-neutral-100 hover:text-lic-neutral-700",
        "w-9 justify-center px-0 md:w-auto md:justify-start md:px-3",
        className
      )}
      aria-label="Open command palette"
    >
      <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      <span className="hidden md:inline">Search…</span>
      <kbd className="ml-2 hidden rounded bg-lic-neutral-0 px-1.5 py-0.5 font-mono text-2xs text-lic-neutral-400 lg:inline">
        ⌘K
      </kbd>
    </button>
  );
}
