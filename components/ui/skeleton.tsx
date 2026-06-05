import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-black/[0.06]",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export function StatGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid overflow-hidden rounded-xl bg-black/[0.06] ring-1 ring-black/[0.06] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-lic-neutral-0 p-5 ring-1 ring-inset ring-black/[0.04]">
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 8,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-lic-neutral-0 ring-1 ring-black/[0.06]">
      <div className="flex gap-6 border-b border-black/[0.06] bg-lic-neutral-25 px-5 py-3.5">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-6 border-b border-black/[0.04] px-5 py-4 last:border-0 animate-fade-in"
          style={{ animationDelay: `${r * 35}ms`, opacity: 0 }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1 max-w-[120px]" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="page-stack">
      <div className="flex items-center gap-5">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex gap-6 border-b border-black/[0.06] pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[140px_1fr]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/[0.06]">
      <Skeleton className="mb-5 h-4 w-32" />
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="form-stack rounded-xl bg-lic-neutral-0 p-6 ring-1 ring-black/[0.06]">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-9 w-28 rounded-lg" />
    </div>
  );
}
