import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BackLink } from "./back-link";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  backHref,
  backLabel,
  className,
  size = "default",
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  backHref?: string;
  backLabel?: string;
  className?: string;
  size?: "default" | "compact";
}) {
  return (
    <div
      className={cn(
        size === "compact" ? "mb-6" : "mb-0",
        className
      )}
    >
      {backHref && <BackLink href={backHref} label={backLabel} />}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  className="h-3 w-3 text-lic-neutral-300"
                  strokeWidth={1.75}
                  aria-hidden
                />
              )}
              {crumb.href && i < breadcrumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="text-xs text-lic-neutral-500 transition-colors duration-fast hover:text-lic-neutral-800"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "text-xs",
                    i === breadcrumbs.length - 1
                      ? "font-medium text-lic-neutral-600"
                      : "text-lic-neutral-500"
                  )}
                  aria-current={i === breadcrumbs.length - 1 ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-lic-neutral-900 text-balance">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-lic-neutral-500 text-pretty">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
