import { cn } from "@/lib/utils/cn";

const variants: Record<string, string> = {
  default: "bg-lic-neutral-100 text-lic-neutral-700",
  trial: "bg-lic-amber-50 text-lic-amber-700",
  starter: "bg-lic-blue-50 text-lic-blue-600",
  documents_uploaded: "bg-lic-blue-50 text-lic-blue-600",
  pro: "bg-lic-yellow-50 text-lic-yellow-700",
  enterprise: "bg-lic-neutral-900 text-white",
  active: "bg-lic-green-50 text-lic-green-700",
  pending: "bg-lic-amber-50 text-lic-amber-700",
  suspended: "bg-lic-red-50 text-lic-red-600",
  cancelled: "bg-lic-neutral-100 text-lic-neutral-500",
  info: "bg-lic-blue-50 text-lic-blue-600",
  success: "bg-lic-green-50 text-lic-green-700",
  warning: "bg-lic-amber-50 text-lic-amber-700",
  error: "bg-lic-red-50 text-lic-red-600",
};

const dotVariants: Record<string, string> = {
  default: "bg-lic-neutral-400",
  active: "bg-lic-green-500",
  pending: "bg-lic-amber-500",
  suspended: "bg-lic-red-500",
  trial: "bg-lic-amber-500",
  error: "bg-lic-red-500",
  warning: "bg-lic-amber-500",
  info: "bg-lic-blue-500",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs font-medium capitalize",
        variants[variant] ?? variants.default,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotVariants[variant] ?? dotVariants.default
          )}
        />
      )}
      {children}
    </span>
  );
}
