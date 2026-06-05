import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-lic-neutral-200", className)}
      {...props}
    />
  );
}

export function StatGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-card" />
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
    <div className="overflow-hidden rounded-card border bg-white shadow-card">
      <div className="border-b bg-lic-blue-50 px-3 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b px-3 py-3 last:border-0">
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
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-card" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full rounded-card" style={{ height }} />;
}
