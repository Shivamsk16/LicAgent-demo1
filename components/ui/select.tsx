import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { containerClassName?: string }
>(({ className, containerClassName, children, ...props }, ref) => (
  <div className={cn("relative inline-flex w-full", containerClassName)}>
    <select
      ref={ref}
      className={cn(
        "h-9 w-full appearance-none rounded-lg bg-lic-neutral-0 py-0 pl-3 pr-8 text-[13px] text-lic-neutral-900 ring-1 ring-inset ring-black/[0.1] transition-[box-shadow,ring-color] duration-fast ease-out hover:ring-black/[0.14] focus:outline-none focus:ring-2 focus:ring-lic-blue-400/40 disabled:cursor-not-allowed disabled:bg-lic-neutral-50 disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lic-neutral-400"
      strokeWidth={1.75}
    />
  </div>
));
Select.displayName = "Select";
