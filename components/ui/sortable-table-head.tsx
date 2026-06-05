import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SortOrder } from "@/lib/api/list-params";

export function SortableTableHead({
  label,
  column,
  activeSort,
  activeOrder,
  onSort,
  align = "left",
  className,
  sticky,
  hideOnMobile,
}: {
  label: string;
  column: string;
  activeSort?: string;
  activeOrder?: SortOrder;
  onSort: (column: string) => void;
  align?: "left" | "right" | "center";
  className?: string;
  sticky?: boolean;
  hideOnMobile?: boolean;
}) {
  const isActive = activeSort === column;
  const Icon = isActive
    ? activeOrder === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <th
      scope="col"
      className={cn(
        "px-5 py-3 text-left text-2xs font-medium text-lic-neutral-500",
        align === "right" && "text-right",
        align === "center" && "text-center",
        sticky &&
          "sticky left-0 z-[2] bg-lic-neutral-25 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-black/[0.06]",
        hideOnMobile && "hidden md:table-cell",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors duration-fast ease-out hover:text-lic-neutral-800",
          isActive && "text-lic-neutral-800"
        )}
      >
        {label}
        <Icon className="h-3 w-3 opacity-50" strokeWidth={1.75} />
      </button>
    </th>
  );
}
