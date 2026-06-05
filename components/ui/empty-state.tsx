import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-dashed border-lic-neutral-200 bg-white py-12 px-6 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-lic-yellow-50">
          <Icon className="h-7 w-7 text-lic-yellow-700" strokeWidth={1.5} />
        </div>
      )}
      <p className="font-medium text-lic-neutral-800">{title}</p>
      <p className="mt-1 text-sm text-lic-neutral-500 max-w-md mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-5 inline-block">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
