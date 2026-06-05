import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-btn border border-lic-neutral-200 bg-lic-yellow-100 px-3 text-sm text-lic-neutral-800 placeholder:text-lic-neutral-500 focus:outline-none focus:ring-[3px] focus:ring-lic-blue-400/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
