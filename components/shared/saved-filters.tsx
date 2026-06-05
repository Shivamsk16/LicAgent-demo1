"use client";

import { useState } from "react";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptModal } from "@/components/ui/modal";
import {
  deleteSavedFilter,
  getSavedFilters,
  saveFilter,
  type SavedFilter,
} from "@/lib/saved-filters";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils/cn";

export function SavedFilters({
  page,
  currentValues,
  onApply,
  className,
}: {
  page: string;
  currentValues: Record<string, string>;
  onApply: (values: Record<string, string>) => void;
  className?: string;
}) {
  const [saved, setSaved] = useState<SavedFilter[]>(() => getSavedFilters(page));
  const [saveOpen, setSaveOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function refresh() {
    setSaved(getSavedFilters(page));
  }

  function handleSave(name: string) {
    saveFilter(page, name, currentValues);
    refresh();
    setSaveOpen(false);
    toast.success("View saved", `"${name}" is ready to use`);
  }

  function handleDelete(id: string) {
    deleteSavedFilter(page, id);
    refresh();
    toast.info("View removed");
  }

  const hasActiveFilters = Object.values(currentValues).some(
    (v) => v && v !== "all"
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSaveOpen(true)}
          className="hidden sm:inline-flex"
        >
          <Bookmark className="h-3.5 w-3.5" strokeWidth={1.75} />
          Save view
        </Button>
      )}
      {saved.length > 0 && (
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
          >
            Saved views
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-dropdown"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              />
              <ul
                role="listbox"
                className="absolute right-0 top-full z-dropdown mt-1 min-w-[180px] overflow-hidden rounded-xl bg-lic-neutral-0 py-1 shadow-md ring-1 ring-black/[0.08]"
              >
                {saved.map((f) => (
                  <li key={f.id} className="flex items-center gap-1 px-1">
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="flex-1 rounded-lg px-3 py-2 text-left text-[13px] text-lic-neutral-700 hover:bg-black/[0.04]"
                      onClick={() => {
                        onApply(f.values);
                        setMenuOpen(false);
                        toast.info("View applied", f.name);
                      }}
                    >
                      {f.name}
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-lic-neutral-400 hover:bg-lic-red-50 hover:text-lic-red-600"
                      onClick={() => handleDelete(f.id)}
                      aria-label={`Delete ${f.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <PromptModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSubmit={handleSave}
        title="Save current view"
        description="Name this filter combination for quick access later."
        label="View name"
        placeholder="e.g. Pending KYC"
        confirmLabel="Save view"
      />
    </div>
  );
}
