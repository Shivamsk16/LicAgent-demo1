import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const alertVariants = cva(
  "flex gap-3 rounded-xl px-4 py-3.5 text-[13px] ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-lic-neutral-50 text-lic-neutral-700 ring-black/[0.06]",
        success: "bg-lic-green-50 text-lic-green-700 ring-lic-green-600/10",
        warning: "bg-lic-amber-50 text-lic-amber-700 ring-lic-amber-600/10",
        error: "bg-lic-red-50 text-lic-red-600 ring-lic-red-600/10",
        info: "bg-lic-blue-50 text-lic-blue-700 ring-lic-blue-500/10",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const icons = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

export function Alert({
  children,
  title,
  variant = "default",
  className,
}: {
  children?: React.ReactNode;
  title?: string;
  variant?: VariantProps<typeof alertVariants>["variant"];
  className?: string;
}) {
  const Icon = icons[variant ?? "default"];
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && (
          <p className={cn(title && "mt-1", "text-xs leading-relaxed opacity-90")}>
            {children}
          </p>
        )}
      </div>
    </div>
  );
}
