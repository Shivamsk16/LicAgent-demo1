import { cn } from "@/lib/utils/cn";

export function Card({
  children,
  className,
  padding = "default",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "default" | "lg";
  variant?: "default" | "inset" | "ghost" | "raised";
}) {
  const paddingClass = {
    none: "",
    sm: "p-5",
    default: "p-6",
    lg: "p-8",
  }[padding];

  const variantClass = {
    default: "rounded-xl bg-lic-neutral-0 ring-1 ring-black/[0.06]",
    raised: "rounded-xl bg-lic-neutral-0 shadow-sm ring-1 ring-black/[0.04]",
    inset: "rounded-lg bg-lic-neutral-50 ring-1 ring-inset ring-black/[0.05]",
    ghost: "rounded-xl bg-transparent",
  }[variant];

  return (
    <div className={cn(variantClass, paddingClass, className)}>{children}</div>
  );
}

export function CardHeader({
  children,
  className,
  border,
}: {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        border && "border-b border-black/[0.06] pb-5",
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
  description,
}: {
  children: React.ReactNode;
  className?: string;
  description?: string;
}) {
  return (
    <div>
      <h3
        className={cn("text-sm font-semibold tracking-tight text-lic-neutral-900", className)}
      >
        {children}
      </h3>
      {description && (
        <p className="mt-1 text-[13px] text-lic-neutral-500">{description}</p>
      )}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-5 flex items-center gap-2 border-t border-black/[0.06] pt-5",
        className
      )}
    >
      {children}
    </div>
  );
}
