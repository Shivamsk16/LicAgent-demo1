"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useCommandPaletteStore } from "@/store/command-palette";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { SHORTCUTS, formatShortcutKeys } from "@/lib/keyboard/shortcuts";
import { Button } from "@/components/ui/button";

export function KeyboardShortcutsDialog() {
  const open = useCommandPaletteStore((s) => s.shortcutsOpen);
  const setShortcutsOpen = useCommandPaletteStore((s) => s.setShortcutsOpen);
  const trapRef = useFocusTrap(open);
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShortcutsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setShortcutsOpen]);

  if (!open) return null;

  const groups = ["General", "Navigation", "Actions"] as const;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="w-full max-w-md overflow-hidden rounded-xl bg-lic-neutral-0 shadow-lg ring-1 ring-black/[0.08]"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 id="shortcuts-title" className="text-base font-semibold tracking-tight text-lic-neutral-900">
            Keyboard shortcuts
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setShortcutsOpen(false)} aria-label="Close">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-thin">
          {groups.map((group) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="mb-2 px-1 text-2xs font-medium text-lic-neutral-400">{group}</p>
              <ul className="space-y-1">
                {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px]"
                  >
                    <span className="text-lic-neutral-700">{s.label}</span>
                    <kbd className="rounded-md bg-lic-neutral-100 px-2 py-0.5 font-mono text-2xs text-lic-neutral-600">
                      {formatShortcutKeys(s.keys, isMac)}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
