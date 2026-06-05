import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon: Icon,
  className,
  compact,
  secondaryActionLabel,
  secondaryActionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10 px-5" : "py-16 px-6",
        className
      )}
    >
      {Icon && (
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-lic-neutral-100">
          <Icon className="h-5 w-5 text-lic-neutral-400" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-semibold tracking-tight text-lic-neutral-900">{title}</p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-lic-neutral-500 text-pretty">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && (actionHref || onAction) && (
            actionHref ? (
              <Link href={actionHref}>
                <Button size="sm">{actionLabel}</Button>
              </Link>
            ) : (
              <Button size="sm" onClick={onAction}>
                {actionLabel}
              </Button>
            )
          )}
          {secondaryActionLabel && secondaryActionHref && (
            <Link href={secondaryActionHref}>
              <Button variant="secondary" size="sm">
                {secondaryActionLabel}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
