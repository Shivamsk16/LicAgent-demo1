import { cn } from "@/lib/utils/cn";
import { type LabelHTMLAttributes } from "react";

export function Label({
  className,
  required,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "mb-2 block text-[13px] font-medium text-lic-neutral-700",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-lic-red-600" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
