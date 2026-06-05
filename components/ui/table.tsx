import { cn } from "@/lib/utils/cn";

export function TableContainer({
  children,
  className,
  title,
  description,
  actions,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-lic-neutral-0 ring-1 ring-black/[0.06]",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] px-5 py-4">
          <div>
            {title && (
              <p className="text-sm font-semibold tracking-tight text-lic-neutral-900">{title}</p>
            )}
            {description && (
              <p className="mt-0.5 text-[13px] text-lic-neutral-500">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className="table-scroll-hint overflow-x-auto scrollbar-thin">
        {children}
      </div>
    </div>
  );
}

export function Table({
  children,
  className,
  dense,
}: {
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <table
      className={cn(
        "w-full text-[13px]",
        dense && "[&_td]:py-2.5 [&_th]:py-2",
        className
      )}
    >
      {children}
    </table>
  );
}

export function TableHeader({
  children,
  className,
  sticky,
}: {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <thead
      className={cn(
        "border-b border-black/[0.06] bg-lic-neutral-25",
        sticky && "sticky top-0 z-sticky",
        className
      )}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tbody className={cn("divide-y divide-black/[0.04]", className)}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className,
  interactive,
  selected,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  selected?: boolean;
}) {
  return (
    <tr
      className={cn(
        "transition-colors duration-fast ease-out",
        interactive && "group cursor-default hover:bg-black/[0.02]",
        selected && "bg-lic-blue-50/50",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className,
  align = "left",
  sticky,
  hideOnMobile,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sticky?: boolean;
  hideOnMobile?: boolean;
}) {
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
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  align = "left",
  mono,
  primary,
  sticky,
  hideOnMobile,
  truncate,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  mono?: boolean;
  primary?: boolean;
  sticky?: boolean;
  hideOnMobile?: boolean;
  truncate?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-5 py-3.5 text-lic-neutral-600",
        primary && "font-medium text-lic-neutral-900",
        align === "right" && "text-right",
        align === "center" && "text-center",
        mono && "font-mono text-xs tabular-nums text-lic-neutral-800",
        sticky &&
          "sticky left-0 z-[1] bg-lic-neutral-0 group-hover:bg-lic-neutral-25 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-black/[0.04]",
        hideOnMobile && "hidden md:table-cell",
        truncate && "max-w-[220px] truncate",
        className
      )}
    >
      {children}
    </td>
  );
}

export function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-16 text-center text-[13px] text-lic-neutral-500"
      >
        {children}
      </td>
    </tr>
  );
}
