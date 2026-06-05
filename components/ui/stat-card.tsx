import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

const accentMap = {
  blue: "text-lic-blue-500",
  green: "text-lic-green-600",
  amber: "text-lic-amber-600",
  yellow: "text-lic-yellow-600",
  neutral: "text-lic-neutral-400",
  red: "text-lic-red-500",
};

export function StatCard({
  label,
  value,
  accent = "blue",
  icon: Icon,
  trend,
  href,
  urgent,
  className,
}: {
  label: string;
  value: string | number;
  accent?: keyof typeof accentMap;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  href?: string;
  urgent?: boolean;
  className?: string;
}) {
  const inner = (
    <div
      className={cn(
        "group flex flex-col gap-2 bg-lic-neutral-0 p-5 transition-colors duration-fast ease-out",
        href && "cursor-pointer hover:bg-lic-neutral-25",
        urgent && "bg-lic-amber-50/40",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-lic-neutral-500">{label}</p>
        {Icon && (
          <Icon
            className={cn("h-4 w-4 opacity-60", accentMap[accent])}
            strokeWidth={1.75}
          />
        )}
      </div>
      <p className="font-mono text-[28px] font-semibold leading-none tabular-nums tracking-tight text-lic-neutral-900">
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            "text-2xs font-medium",
            trend.positive ? "text-lic-green-600" : "text-lic-neutral-500"
          )}
        >
          {trend.value}
        </p>
      )}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-xl bg-black/[0.06] ring-1 ring-black/[0.06] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&>*]:ring-1 [&>*]:ring-inset [&>*]:ring-black/[0.04]",
        className
      )}
    >
      {children}
    </div>
  );
}
