import { cn } from "@/lib/utils/cn";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-lic-neutral-200 bg-white p-5 shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-[15px] font-semibold text-lic-neutral-800",
        className
      )}
    >
      {children}
    </h3>
  );
}
