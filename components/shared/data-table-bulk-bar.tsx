import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function DataTableBulkBar({
  selectedCount,
  onClear,
  children,
}: {
  selectedCount: number;
  onClear: () => void;
  children?: React.ReactNode;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-lic-neutral-900 px-4 py-2.5 text-[13px] text-white shadow-sm">
      <span className="font-medium">
        {selectedCount} selected
      </span>
      <span className="hidden h-4 w-px bg-white/20 sm:block" />
      {children}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="ml-auto text-white/80 hover:bg-white/10 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
