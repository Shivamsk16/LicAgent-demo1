import { cn } from "@/lib/utils/cn";

const variants: Record<string, string> = {
  default: "bg-lic-neutral-200 text-lic-neutral-800",
  trial: "bg-lic-amber-100 text-lic-amber-600",
  starter: "bg-lic-blue-50 text-lic-blue-700",
  documents_uploaded: "bg-lic-blue-50 text-lic-blue-700",
  pro: "bg-lic-yellow-100 text-lic-yellow-700",
  enterprise: "bg-lic-neutral-800 text-white",
  active: "bg-lic-green-100 text-lic-green-600",
  pending: "bg-lic-amber-100 text-lic-amber-600",
  suspended: "bg-lic-red-100 text-lic-red-600",
  cancelled: "bg-lic-neutral-200 text-lic-neutral-500",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-medium capitalize",
        variants[variant] ?? variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}
