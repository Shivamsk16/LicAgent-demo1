import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-lg bg-lic-neutral-0 px-3 text-[13px] text-lic-neutral-900 ring-1 ring-inset ring-black/[0.1] placeholder:text-lic-neutral-400 transition-[box-shadow,ring-color] duration-fast ease-out hover:ring-black/[0.14] focus:outline-none focus:ring-2 focus:ring-lic-blue-400/40 disabled:cursor-not-allowed disabled:bg-lic-neutral-50 disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
